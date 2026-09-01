import { formatPrice, calcDiscount } from '~/utils/formatters'
export function useCurrency() {
  return { formatPrice, calcDiscount }
}
