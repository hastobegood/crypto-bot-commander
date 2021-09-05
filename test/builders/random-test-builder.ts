import { generate } from 'randomstring';
import { sample } from 'lodash';

export const randomString = (length?: number): string => {
  return generate({ length: length || 10, charset: 'alphanumeric' });
};

export const randomNumber = (min?: number, max?: number): number => {
  const minValue = min || 1;
  const maxValue = max || 1_000_000;
  return Math.round((Math.random() * (maxValue - minValue) + minValue + Number.EPSILON) * 10_000) / 10_000;
};

export const randomPercentage = (): number => {
  return Math.round((Math.random() + Number.EPSILON) * 10_000) / 10_000;
};

export const randomSymbol = (): string => {
  const baseAsset = randomString(4);
  const quoteAsset = randomString(4);
  return `${baseAsset}#${quoteAsset}`;
};

export const randomBoolean = (): boolean => {
  return randomFromList(['true', 'false']) === 'true';
};

export const randomFromList = <T>(list: T[]): T => {
  const value = sample(list);
  if (!value) {
    throw new Error(`Unable to get random value from list ${list}`);
  }
  return value;
};
