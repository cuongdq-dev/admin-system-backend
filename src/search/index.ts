import { REGEX_FILTER } from '../constants';

export const searchKeyword = (keyword?: string) => {
  return { $regex: keyword.replace(REGEX_FILTER, '\\$&'), $options: 'i' };
};

