// src/infrastructure/lib/matching/fuzzy.ts
// Robust production-grade double-weighted name matching engine

interface MatchResult {
  score: number
  matched: boolean
  details: {
    exactMatch: boolean
    tokenSimilarity: number
    levenshteinDistance: number
    normalizedScore: number
    hasReversal: boolean
    hasInitialsMatch: boolean
  }
}

export class FuzzyMatcher {
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-]/g, '') // Keep letters, spaces, hyphens
  }

  private tokenize(name: string): string[] {
    return this.normalizeName(name).split(' ').filter(t => t.length > 0)
  }

  private calculateTokenSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1)
    const set2 = new Set(tokens2)
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    if (union.size === 0) return 0
    return intersection.size / union.size
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) track[0][i] = i
    for (let j = 0; j <= str2.length; j++) track[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        )
      }
    }
    
    return track[str2.length][str1.length]
  }

  public match(
    studentName: string, 
    ocrName: string, 
    threshold: number = 75
  ): MatchResult {
    const normalizedStudent = this.normalizeName(studentName)
    const normalizedOCR = this.normalizeName(ocrName)
    
    // 1. Exact match check
    if (normalizedStudent === normalizedOCR && normalizedStudent.length > 0) {
      return {
        score: 100,
        matched: true,
        details: {
          exactMatch: true,
          tokenSimilarity: 100,
          levenshteinDistance: 0,
          normalizedScore: 100,
          hasReversal: false,
          hasInitialsMatch: false
        }
      }
    }

    const tokensStudent = this.tokenize(studentName)
    const tokensOCR = this.tokenize(ocrName)

    // 2. Name reversal detection (e.g. "John Doe" vs "Doe John")
    const sortedStudent = [...tokensStudent].sort().join(' ')
    const sortedOCR = [...tokensOCR].sort().join(' ')
    const hasReversal = sortedStudent === sortedOCR && tokensStudent.length > 1

    // 3. Initials / Abbreviation check (e.g., "Opeyemi M." vs "Opeyemi Michael")
    let hasInitialsMatch = false
    if (tokensStudent.length === tokensOCR.length && tokensStudent.length > 1) {
      let matchCount = 0
      for (let i = 0; i < tokensStudent.length; i++) {
        const tS = tokensStudent[i]
        const tO = tokensOCR[i]
        if (tS === tO || (tS.length === 1 && tO.startsWith(tS)) || (tO.length === 1 && tS.startsWith(tO))) {
          matchCount++
        }
      }
      if (matchCount === tokensStudent.length) {
        hasInitialsMatch = true
      }
    }

    // 4. Mathematical similarities
    const tokenSimilarity = this.calculateTokenSimilarity(tokensStudent, tokensOCR) * 100
    const levenshteinDistance = this.calculateLevenshteinDistance(normalizedStudent, normalizedOCR)
    
    const maxLength = Math.max(normalizedStudent.length, normalizedOCR.length)
    const normalizedScore = maxLength === 0 
      ? 100 
      : (1 - levenshteinDistance / maxLength) * 100

    // Blend score: 50% Token Similarity + 50% Normalized Levenshtein
    let finalScore = (tokenSimilarity * 0.5) + (normalizedScore * 0.5)

    // Apply bonuses
    if (hasReversal) {
      finalScore = Math.max(finalScore, 95) // High score for reversed correct tokens
    }
    if (hasInitialsMatch) {
      finalScore = Math.max(finalScore, 85) // High score for matching initials
    }

    // Cap at 100
    finalScore = Math.min(finalScore, 100)

    return {
      score: finalScore,
      matched: finalScore >= threshold,
      details: {
        exactMatch: false,
        tokenSimilarity,
        levenshteinDistance,
        normalizedScore,
        hasReversal,
        hasInitialsMatch
      }
    }
  }
}

export const fuzzyMatcher = new FuzzyMatcher()
