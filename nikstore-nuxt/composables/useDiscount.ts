export const useDiscount = () => {
  const getDiscountBadge = (product: any) => {
    if (!product?.discountAmount) return null
    return {
      percentage: product.discountPercentage,
      amount: product.discountAmount,
    }
  }

  const getTimeRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now()
    if (diff <= 0) return null
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    }
  }

  return { getDiscountBadge, getTimeRemaining }
}
