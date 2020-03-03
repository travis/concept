import {useState, useEffect, useDebugValue} from 'react';
import * as sr from "@solid/react";

function toString(object) {
  return Array.isArray(object) ? object.map(toString) : `${object}`;
}

export function useLDflex(...args) {

  const [result, pending, error] = sr.useLDflex(...args);
  const [cachedResult, setCachedResult] = useState(result);
  useEffect(() => {
    // clear cache when args change
    setCachedResult(undefined)
  }, [...args]) // eslint-disable-line
  useEffect(() => {
    if (!pending){
      setCachedResult(result);
    }
  }, [result, pending])
  return [cachedResult, pending, error]
}

export function useLDflexList(expression) {
  const [items] = useLDflex(expression, true);
  useDebugValue(items, toString);
  return items;
}

export function useLDflexValue(expression) {
  const [value] = useLDflex(expression, false);
  useDebugValue(value, toString);
  return value;
}
