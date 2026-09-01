export const validators = {
  required:  (v) => (!!v && String(v).trim() !== '') || 'این فیلد الزامی است',
  phone:     (v) => /^09[0-9]{9}$/.test(v)           || 'شماره موبایل معتبر نیست',
  otp:       (v) => /^[0-9]{4,6}$/.test(v)           || 'کد تایید معتبر نیست',
  minLength: (min) => (v) => (v?.length >= min)       || `حداقل ${min} کاراکتر وارد کنید`,
}
