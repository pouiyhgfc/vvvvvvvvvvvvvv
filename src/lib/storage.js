export function loadJSON(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
export function saveJSON(key,val){try{localStorage.setItem(key,JSON.stringify(val))}catch{}}
export function buzz(ms=10){try{navigator.vibrate&&navigator.vibrate(ms)}catch{}}
