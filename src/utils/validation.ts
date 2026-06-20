export const DISPLAY_NAME_REGEX = /^[A-Za-z0-9 ]{2,20}$/

export const isDisplayNameValid = (name: string): boolean => DISPLAY_NAME_REGEX.test(name)
