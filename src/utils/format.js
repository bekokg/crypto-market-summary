export const formatCurrency = (num, currency = 'USD') => {
    if (num == null || isNaN(num)) return '–'
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(num)
}

export const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '–'
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num)
}

export const formatPercent = (num) => {
    if (num == null || isNaN(num)) return '–'
    const sign = num > 0 ? '+' : ''
    return sign + new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(num) + '%'
}

export const timeAgo = (dateLike) => {
    const d = new Date(dateLike)
    const deltaSec = Math.floor((Date.now() - d.getTime()) / 1000)
    if (isNaN(deltaSec)) return ''
    if (deltaSec < 60) return `${deltaSec}s ago`
    const m = Math.floor(deltaSec / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    return `${h}h ago`
}