"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from "react";

export interface SneakerProduct {
  id: string;
  name: string;
  image: string;
  brand: string;
  category: string;
  color: string;
  price: number;
}
export interface SneakerOrbitProps {
  products?: readonly SneakerProduct[];
  autoRotate?: boolean;
  onBuy?: (product: SneakerProduct) => void | Promise<void>;
  className?: string;
}

// Reference-video cutouts and one attributed New Balance photograph, embedded
// for portability. Replace these with your own high-resolution catalog images.
// Provenance and image license: public/reference-products/ATTRIBUTION.json.
const PRODUCTS: readonly SneakerProduct[] = [
  {
    "id": "reference-0",
    "name": "Dunk Low Blue and Pink",
    "image": "data:image/webp;base64,UklGRuQDAABXRUJQVlA4INgDAACwFQCdASphADgAPlEijESjoiEW2gY8OAUEsQBpUCY+I5Avgfw7zdBHexnIN6nvEu/t/UV/Xf1D/s7+t3vIeeP6Q/UU70R+1Ho3UhPH9aTBqY/HjGkCrvPDr29l3c1Try2yG5nBbrIF+6ZtQMszU7od4nTP20sCxpsvl01mfLKnJm1JMlA9pHdohhjI6mIerdWOxWJT/7z1f/PPf5YkmJmul9P4aYdVFrGj5yEtOznndpaGA2JwAAD+/asIZlfr4M5PG8sCHxWY02p134/phQgLc8ldrupnRkf92fKl43y57fUClnFTdCGog3dwVk7fF4/xzMiM3DGtLSaHlPHGaTZNciCrmWT7N5z4mBoiN3A6D778XMXIY5d0T87+e/c8f03c+rdH7Dyh7gGDispNP2KzfzHe75IjH9M6P4rI7gFnYzD4IrxP/QccS/R3qS2B5JMnG788e758EIkCz54YzzF4lV+dvLCGF0czsA5ZbbjitfXAIUfDn2K0hpPoF6o1bQEfd8oD5O0Q9l+HSbtJBs0W+Nq7n7GpJxmicxoie0G4b4Akt7s0dCGEdzsATwqJyW9vVoTwPBtoWFLgiOywxHD3u+b3vZTQryyIsCErTQP0DQDSBaN2m8J5PLiD4WkodHSeL4SbO2+Su0zcbBUxk0HZaqq7o7ElUwmfDenhNjJ5VcAU/IAvLGl+ONHF1rcPig1my088Nvi0G3m4I2sy/4HoXIfeinyghtCTsxgvdoiP9DGcvLlPrpG4xjv/R0jqVkTeSO4rMv+EMsXojEQIq2yxrl1Vl0nmED8qZ2bN9kRzNiH+piv8/TGsmk7kcrUSKm/i+CmbIcH6dmKHwaGcsgcCpv0AjLhZ0uUN3hAw/V9Q8yMXYwm6o2J2PuZik+C/g18jjWEZzcMJexg0I+IPs4S+Eo4LwXSua7FY9MIx02tXoHaKMw/40p+kk6XnmV7BEEv3ruDTW+MVzqcbR5ze1ggmoXrTxbd4yZsCRZ8+bD7SFn1e0gDaOEc6Mh/z9CA7/KakQa6FeVPjfex/320emtzpVMe/IuMdVuuEydi5xBpWJj0k5KhnT53PmpZ8ja7UnFol/zEvz66EkZCUF0qVyP3a62r3h/pV+bJVL8BoCbkdoXWvJRtJMic3QUWy0w8KVNnc3RA6XtZsIRpUqAN1tdm8A+oPIxDmZPVjaFIKrVvOWZ6SCql1MFr+cNlOJKAGQwuDaAesQ57wUkWSOlC9YS/66cxEGGmEUJA2Gh4lpJF+fVqoEl7oDEjrYXHx6KyCQ6ThtMM5feqsOcHZuB3/nToWCJf3gLTYAAA=",
    "brand": "Nike",
    "category": "Dunk",
    "color": "Blue",
    "price": 115
  },
  {
    "id": "reference-1",
    "name": "Dunk Low Mint",
    "image": "data:image/webp;base64,UklGRiACAABXRUJQVlA4IBQCAACwDwCdASpdADgAPkUciEQioY5WGBQCIljAMzIbVHGwIjx8XArwv8FN2U04wzguoNhUDgYUiUpdSlP+N6XSCtESVVeeNcZG36ka4Xtndcut4mR+y5+PmFxzMcDiWPbsHFnVOp3qYEs1UdcKZJtGtrI0sKi9g9RfM+im2RHoKGx8SZcm78kAAAD+/Q6TgfDH/pr7kpLt4BFqHX4WU+0wVHVwKC3pg4yMi4KZyqz4E0heYBLciJ9bMtMPqTX7XSTyzBqPKSsHSSbgRoqxNq6us5ROLOtvoLrce19JdQSIqarCcGZM8AbfVGlwDQaNmrrAruXaK+DvPFwRFQuWrpd+F3bW4kSgP+6QHCTCF5HlI96WwwiTeGhHdz6rUvj4zE34WUfBqtF0kQjqDEb5TTQKlWd5CpBFmJSOn83ZH9bMhBqanWAFra+xGm6NWWtrhvAfKtJfa/CD2gXA+Ro3LveikEedDRk4kyayHuAUJ6sKYdjCcvR5BZfAN6xo75i2z8f3x4/mqF9lPTS8mOqOt2ZKXbFr2h2oPq9eL87CdtxUVsy+x3QqwxjCxgE/cCyuXValexc4UhEG5bml5Ieviwi1H5JUyxGvay0aZnfadOXeM3Gn8DsFHnQkXFo7wU/Abg/5kalbsjS9aQHBU88ENT1w1g77n7aB+hwr+JRFz9tVZ9ViRMEHFkfmAFdsxhMxaYwzMw9WAAAA",
    "brand": "Nike",
    "category": "Dunk",
    "color": "Green",
    "price": 120
  },
  {
    "id": "reference-2",
    "name": "Dunk Low Royal Blue",
    "image": "data:image/webp;base64,UklGRpoDAABXRUJQVlA4II4DAACwEgCdASpdADgAPlEijEQjoiEXXF04OAUEoAy9hUw82xx4Nvnz9jb9dDUk7fZ+AOgR/Nv8bwHOc+Dj9gtZTTRvs1wZSi5BxF0oEa1oIWe0Kz0LYXNOWtIyTBzcGlgwn4bpxrdqrkjxKV2p+Va4c5I0vxaGtI9E4im8S6PBRDWOcvOllrH7B0rTBz3DT0REj3bfrKREhhPtiWySdvScgAD+/asIZllHx/AdzZCJunqTJHKf3/2Fdw2+CeHpSV7EMe6OmEWBd0zKtun4SPMsZjOQqkNpIeBtIrIW4ehFhBXIGHXlivgUifgtIGG4i4ATAcFntXsF/Zr2tCCjQ9uwDmgkhQpICwT165jDzRdthq1+Vy6H5d9VhHXLg6wwzAQ/miu7W9AIKzqNQhQrzXuHxOFsvJPCTRdO4GDigQ0GRf32UeodXQo1U4U0or8m6gosszqHF2lfV5nkTu2usegPmEwu+9iYzXrwR/jB7imGKX1DaFVuP24MHKFpQ9OPdqGIaYfmd8plMdLllhWMI2bULzeuW5/R43BPL76LaYd05i+sPdp3Ijhtr8e3Eg31swhDbea6sJTS6gbZL1p6Yshbni8F7dRB6ZtFNuFMq7DGc2ZJry1rvpzTynqJDje4gBqW9Do00bc/1RvPnQmWkTVbBSaK860gRf/813liq+zycQYi6WKCXpQiEsyRpx+d0cb2uKxsEaEYC3wW3sLS3PfOfL2whEC2Egd+ikVrVMfqHxLUEWoBc17bbRtaRdWOUY6YOI/Td+cJKsv9fjiuwJb07H1Dc9vjXboMpFPUG9OPSzKVh2nQCV21+ZmTwNWKjfJIiNdicwHN6XbeDJ8WbfvrRCprcGb3mkqqCIkjR3S+egxU27Zw2RzkcYmjd08UDa9gKcntLDxdXMs7Ulk3c0b+g6z81CbakV6AitqyR9qNz8ApfCBXaFqRUZ2vu9hal3brc/gj8YKyYczBgQ02GCnwWTJZClyqv0Yt89PCGY+5fqXqehkLG2YXKMxv6s/6Fdb/HTH2MPYed10dfNzMkC+l40jwnGq3u7OdVdzfMUKYvoXmvVhyPd3D1hE8LMxju0yXYMhDh9GUWpRPwR1hWZPtSES1XbSuAfQTFxaPkmIB0Lvv1vthWF4BPA5dytyVWj+A+iduDN2Vl0tdiYjn54XZGCJeMEAjmKiKAT++7/p1gTIpc4guKJ8K3FDilRfAAAAA",
    "brand": "Nike",
    "category": "Dunk",
    "color": "Blue",
    "price": 135
  },
  {
    "id": "reference-3",
    "name": "Dunk Low Light Grey",
    "image": "data:image/webp;base64,UklGRvYBAABXRUJQVlA4IOoBAABQDQCdASpfADgAPk0ei0QioaEb+cwAKATEs4BnzFMgyS9ovIXpeaeRqy1/YmXLwX5/U9s3y0+WZMZ5fDTr+zkRF9v56E3Lo95qc/5L+c5FkkVjUoB7gdSxBNNFaAC1JP9ul0o/Z6ScEQRpzriysg60yNmgAP79FMQXR7LZUUca3sij8FJ6s4w/erCbLZ0enMXZlNpGP9e77GQYFPuhOZd65eAI/w9HkSkWap8tGtClddfPXAr4tU9tntFQ2PlE3rsiGihIwjk8kuP+cgFIVM4rw77SK47vw9a0n32dsQRDaxGmWE/pu2Fs19sXisnOADMgtf/kAfFA0pcUS2ikpoLltJ+ZvZDCYAieRbdGR7+fnHMVne7y/By3QnMfnozrIl+QZPAJF5JANAR5BQcX/LY3W+OHvO99JurTqzk9W0CIJ35OEPjpdxiCuRjpYSxp7YR6d9TSucW4SynFiy4MYgnN+eLh6YGJ09DAEAHK0KfYcpov+ltBQoxdlZw3zpTmC+whpDG3KDGScpAR+21XLSdICDkmSHqRR09084iyDRzEr12CTaLWQ3ctFEwMsbjm3HIzJad2ki6kE4QMH4z57tE7la1laao1N3X7WdveT3myZkPQTn0TwFAzS4oDVhH+9TqKIamvuJESgAAA",
    "brand": "Nike",
    "category": "Dunk",
    "color": "Grey",
    "price": 105
  },
  {
    "id": "reference-4",
    "name": "Dunk Low Black",
    "image": "data:image/webp;base64,UklGRvQCAABXRUJQVlA4IOgCAACQDwCdASpgADgAPlEijkUjoiEVWQXAOAUEtIBmEVw30Ef8RIz+JNDid0lk0svoYCAwHoWrpM6HhPjOmsA3ZUaCWR1yUtcxXWzPHGDL5ykMeOSo6dUgbFX/+T9lrKQkyleNOSEqkAi9l2huJnRR5YCWX7ZxcgmZWMsF6Dv33Q+PEkVkFB6gAP79FMJ0GiVvw1VjuZOaSoCMiMZnFs7kIO00shJxcNK96j/H1RwdlUqeUmqH+lj3vpGK/MYG1EZeO+Pe9Z049LOwRbhDGthkjaZq3oWJV/b7REuRZmAn2jPIf3oC5aFXQRDU3KFXAtzNfGlfgeChPX6wOV26ipJHUTFRlhmwkxhzIjt2/oyu3fng0C46GZkedv4RZKq4Y8q25CHPWiwtBgWNCFGwLbmLn4M3Ct3MBLl24b5sDARxK+OtNko8fYc7t/dW3W64dU5k+Mo9uqaKhGPqcya7x1NDFyY3m0BAKyE+1oY9/wre9uC3nXYJlz1cqWvDxgSFEb4FMdVCzeKTZTq/rTlg9/oSKDdkdr8OY/TtmVp85m7snhDvFf7TL4bpzE4kqrkOIRU+aj9NQHij+JdkXHZtGKtQxmFUG+KmjPnpGepdK0u1zzHqojIqlIuf/i06L4e/v6CRRPHeXHG+Ju+MYWN8/gwgP0L+ib4SjM4bl/yYlSqcXpQrbbH+1GutA0d2Zi5Qiro7+afFBOaIXockEBLZNI4rMX1+xAEobnamN8Wq9Q2kGvJCZSdr8Fd1j17x2aM0zvoHqfpxfBVNaIg1QbDTrfH4yqodrO9d5vBvt5FNTtOmK9bvQbB+L8E19DraGnvRTeSJisWTcglcDNSP1mLGtNJDrLSmUY4IG8Pzx3+0eGbo1iw2lcq/fIadL2gaVi5ubY9V3J7Z4puNI9OnfQa9PO+qMm9hOmXwyGy1q+J06MaZLfzGEE3z5QkrhFsp92HOr79w//mKqHhiG9iuAxpo1WuYmzozIXRnGbzbgAA=",
    "brand": "Nike",
    "category": "Dunk",
    "color": "Black",
    "price": 125
  },
  {
    "id": "reference-5",
    "name": "Dunk Low Multicolor",
    "image": "data:image/webp;base64,UklGRvgDAABXRUJQVlA4IOwDAABQFACdASpiAD0APlEijkQjoiEVLHYYOAUEsQBpUjuoEJU9BSLHO41f5p3pfmA+1X3gNM63nmfa7cUqjeA8U/g4p6lUK5KPSHcIjFpqgk5MMOH+C7wMeOYrfhB/o+YzchcCixq5JT9LruU6vYdaU7YIFSmZoYRCsq0+wc0xhuCXXMmLqajB9JEQO3PP3RDa7KyFKP1gskywRyp0C2bYrncGUunjulwNL+ZXWAAA/v0Uxlqywpe/4RP2/yPNG6plvw1Bw/fU0way1LLOUlBwMyfJyP/9plNLHjdbkp4AAAAcGJgEq2UM4bzpoFmAiSS5l/1WrYbd8gkfKYJL7qyduCxv5idZPDKGHpktN7TOnkgfqlhzfNt5lbhIFX4+/H+/EEYGe3rxyMoCPrJ30n9nkQLppevZ7X4GnqmCvYpcuraIWazTDQPkKopJnU/rAggVkEnlt7SIhK8IIYwvWv6fYx38GLHqm0cF+MUms5YN/zWUByq14X+DssK6UcguuAbk5kR+g+iVwJZkNQFbc80lrnpYJOfitAvl/CkPzz6chcK4vMkutbseEpD54DYH5jzsy6xQ95HnypA1qST/00eDYc/fmfnK+2DCb3lqaY0BS7oeiirC9zsb9dyP+NDlMspStw+KyF62fq+plZoniwQx5nCzTJFGUwzNFu9e0rREnodbac/gfUTOUBlZieNWgkYy2vNx02N2wslyj5gsT5c/dy29tU791pK3N2ss59jb59EenW+fp1Kbd91r4Ba61lZj81CwI60bPHniR+ryFEqIVzRKiJ0Ppy8jkiyG8R4mWjfw9zIYoC1+vkRJtjpfQuCQsVQewxvrgNG2c11ym+52wbS3Lze6a2mxWXMpYp1P9l/D+3bio44oVp1Lz+94vQeM3349G49f5HEo6d/0vDf4noXk532DWb4xqnHQ/2N8+osYmWLwbVVN13PRV2fpd1rX/PbUv/zVxYIr79uzk/KVX8vFms141f19vunvIcykEcBgT3E5RRRW53RrpniifYXJIWZabsYHSb3xrdmFLAjUaam0EL8inLBb0jN8HxRTz4O5tk7Vlud9jUffbeJwhG3M3oUtrQ+xriisv6on9ZwRkLhotb2b7WWxH/dDXidy9/N4ivQPeSWPnOmcbaOfHuej0gQo9J1vg8Ksn2z/uZQVU/6OtXPCMVG+vXQTErHCiExxxdFqgPrhzf1fLtHnTYXgXFmtRmYCX7ceH0OO+cXwlRr0jrLPn+X0ooAPjPlvc+GjVQ23Vp0Sdzq/QZgvVmiS+I3VGadLbB/iJ2yeXN/8PNCSsH7YmqmS5ucltPv6dcyAYdMMDwBIQVTqAAAAAA==",
    "brand": "Nike",
    "category": "Dunk",
    "color": "Pink",
    "price": 145
  },
  {
    "id": "reference-6",
    "name": "Dunk Low Sail Green",
    "image": "data:image/webp;base64,UklGRkgCAABXRUJQVlA4IDwCAACQDgCdASpdAD0APk0ejEQioaEZ+iVUKATEsoBny/sq6+ne6wtUFlPGVgXi4vXknSaoCFDEHeq7si+nuoNHpV+rLQ6Tj5aU0D/qoysZfPz51xkafD7ysSjoAOZ/FgfNEcuVw0JGECAHnZ083cYBAFY7zRTBtGFmkxE74RVQAAD+/akEnQnvf+8XPcpPhzNXg0puYFekyGHAlFUyXBKmb3W27PN7LStuD8zGC/UVkFVuJZoqDx0/eHdFjEAFrvOzbrq4TkL3bbgOrHhRVyB65Y7KQbsTnIO0IHCKyXfYOodl9AXKPUdt9GAV48tjexzfP2DoOtao1pNvEYBxKVlTu+Kei5Bc9dLhe27DgAwsfjujySu1lLn6LLhp62hjwYiY4dl90rLbHEZ8nKyzDYT9Zv9gaCYW79zQcCf32CiQ+2DJLIu0gVqSd9dohvXlcXkPQHa1++DLEwG/91ciUL26Bo/8XvI2MZy1V9JH1jNW/jRisYaZCyfOrSPXrK3Kx95RYtJxrLF6CtAs9tV9eX+KVCUAvavFNB5gxZ2KHBTxgHkRz8G2Qw0XDlAMXNk5Eo/ZJ9bgks90Tx5tJJlRlKEJ6Wpg7ipG7qtPKb3iQTRyfMR/q1yGYnOtAdHZ3NmlCWc2sDD2wxqZ84BiCyjCn2PJc2eqNDgJUuA5Gc7DDVCz8kqaOdXuINUM1BS6G5HqM48e+oo8C/0gdrqb8PMQxSyYHgxNAvWRIMUAv5JG7G/2awL+zdLGFfNA2GUsawAAAA==",
    "brand": "Nike",
    "category": "Dunk",
    "color": "Green",
    "price": 140
  },
  {
    "id": "reference-7",
    "name": "Undefeated x Air Jordan 4 Retro 2025",
    "image": "data:image/webp;base64,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",
    "brand": "Nike",
    "category": "Jordan",
    "color": "Green",
    "price": 262
  },
  {
    "id": "reference-8",
    "name": "Air Jordan 4 Black",
    "image": "data:image/webp;base64,UklGRvoCAABXRUJQVlA4IO4CAAAwEACdASpiAD4APk0gjkQioiGYm7zsKATEs4BqDJAstBBY67KmqTmuAQ+DVCfpV7yld9qzE/9RSi+SxfwHWFk+usMpdo8Udbkp6+SDlKT4DC9dwW/lCl4r3V4pk+qqw4R/DFiBTIZYEhVROXZG9pcZVulJc0qPExsQT/wkAZnVi3CiKiNQMiVtQAAA/v0PjrfUQ50X//cMT7DaJg1ajkeW4ckPwzxE0sgGCav6xtmt2TG8Ijbv0vQ99sfgKHrL+SF8lB0F8Eo2xm/s75L+X0pBX+ZfjUKvngqPaGH+tLNrX6G0qelBBubJyP7CAvW5vUJwWkwWEGYesChsrCAl3RgCMD5qQFoHfy/7aeGLw5CLzp+P1FV5vKTpphBDimhXt8MxHhsFa8FAqb3teSv9I5Gh77C0WhXS6APYrQvfMcyvymZ7Mkmg+Fbt+IOYEqLz6fr1TQ1hovto0JFszmW3vYn8spKFJqTe6W4nlFd1/OWwNLI5SaSN604c6iowdCE4X244PQPUtyPoLlMs17X8Y2qOTWqSlhIR4RLYu7B3TQcc2wT7lmMx2KT9jltxMlc2W6rVJK/xaH88lt26uRv4RTDckqJZy67ofZFg7v1UL5V9039rw6TCnzvJ9bWU4AmaEXMABT9/eVxz6d8VNNuQLNXtu/F8R6LVGP+0ly2qCW7fFcyWaEVT9lKjAKyzYd1Xg+XDyTIwxsF3UrxD+t/gUe8upkNqhGGFt1ZQx2JU1q+2Lw6C7+bpmn2dyXS98/tn/Mzv0yy1xLBd01LqHtas/VFy9OQKAgPw2d5rsxLyDkCUS7IW6mGRZyTQ2C55NWoNr3/5dqy33e24Xt94YW1ZjWy6WpZAZLte8CIxW+5D0Pztr0e9/V8ZJVaUs8Lv327gWsbsjrbrF8eVnpufR5+4BJJwVDhglE4z2X3qxGtTRJ4ioCR7adQevaF/NA30O+8kuJXw4eUdK2v1+M1zvUO3YJ47Xcz9JPErw7A0AkHsAAA=",
    "brand": "Nike",
    "category": "Jordan",
    "color": "Black",
    "price": 190
  },
  {
    "id": "reference-9",
    "name": "Air Jordan 4 University Blue",
    "image": "data:image/webp;base64,UklGRroCAABXRUJQVlA4IK4CAADQEACdASpgAD4APkUci0QioaEb/cSsKAREs4Bo2gIDztAJxkTCQbEM2SXbZ5xIhwmOM6P/sm5C5Zd9dMtOSmfFeaH9a2unt0AWQisiUdCHc4zhA4/onzSv9o+4Oh6YsUlphPFnKEN2Pid9NQPc7nZix9Wh6TfTqexAgSfwCyNnU0nqCOPQi6rsIHtXbRtPQAD+9V1GQHkI1R2C6O3keXBppOczqr49YUWDwCuK75cmdshqFPM3XaI4MNokejGa9jbROY7IFl7pW0VhC8Aqe6ZeVq7Ok1zvLTxLFNBvgzq7O3jrdHGBo2z1TCCXIIubphD7P0Zt/yoBYoU/bV1NhVLCf1tyh/c3yUu3/Oq1oAfioSdMtqj+AAq3VCLUawlixnzJ4ABBsdoceFP+ZoQ/VZwUrYnpYuBOOaTUZ9jrtuvXr4TCZ6t0jbKAnIzW05Np6AYBXDsgJEibQZszAyhdCKY82H4+mx9yIEywubNEX8GjGwFdL2LJVvSzKzGiVonK205TvJ7jvj1F+VRklwOQAnLMeKcJr1mGl6eGx1a+lyVR9aAPTU9AadFp6GmEOz9z16KVeTO8TtKRhRt7iuwcajxnrwAeojWmn2iIec4MF2gU3wOxp1NZ5DLYa7aHkOoRv44x+E0h3SFIf6T+5w27WZmd+xj7dBBO9NiUlMlKFfvHWajzjsv1/LFghb2UZnJ8+NjD/dUVFT7kZOkq2Xd0eKBi+rvR8LktuBp2mYfoxpAygXKU9B2TTGGwfcOMg4CD2hb18sH0zuMzjMXJWc4u+2eSQDUQ0ok4Z2s7U4jkOAHXM8rysq3p6cHFG0ZzXl1t5x/xjuEMHXli5mZCq2HFHlBiTDNpFtm9k4fgokn4v2BqSNDjsXsGT+7LAJAauJ/gN7B9tGKiXI0yg1w3ZcYAAA==",
    "brand": "Nike",
    "category": "Jordan",
    "color": "Blue",
    "price": 210
  },
  {
    "id": "reference-10",
    "name": "Air Jordan 4 Grey",
    "image": "data:image/webp;base64,UklGRqwCAABXRUJQVlA4IKACAAAQEACdASphAEQAPlEijkQjoiGW2q3MOAUEtIBqZ8H++nyehbjVaUKFUx5RFuGIeKgDixO2CljxHQEFLhjvldP7c5aLWn2qM8hKc1N/wwitaC16GwPm1Ue/DWZYEg8YvBMuVui155u7/SPXKsiG8h/P7JWjXHB5Dt073MSmoddDYi6HFGLtOS0D8AD+/RTDxU931cfp8jqunCi27hSt3Yhoni/Z6K63BaOp52NaSTX0GD8ov+s/pi436RmXSfenJ1b+KBDQw0sgwzGXBQuF6ZultIlAQGvG2/1Y6Dn8pbbjabveGxV8x2l/5DtJrswuLjkyFKPyFnNuBckeEVkr/tGz/PZTgywRiVgV+rNmA0ZRMFtpqRL3c2jKRQVMWXSV/cggGwXh3YASiPgXxweoLBo7RaVEJupZGbbLtDXdtEWE0YnvIALU0aN987JBHXSqQJjEkUPF/OnejEG3asY4H909UyY/vSv97gl5pN020UgnKaBUmD0TLo5OsvYRogXRzf8as4jxWihEFITlgkUvrmuAtl5BZn8A8jwHjC3WNdOMi5vAbB3m0QcPnOn7/N/xSSMHjeuZxtpP2A676DPL+/LfAhOUx+GphZa8p2j0/v/PDHukSkD/pCIMwDmIbG36dUy+Rb/8HPfRo55/+hlb4wxmeQEPRZVW3ajd4pFi+0b2GjeCwo0UXYmFc4CKLeX9P+IfhMMbTRPk+HoTMORlKQXykGrnSUhZk0EcsTw8BW2bwvhvynq9/Z1khOcXSo0iMA6F4Ed+/3Ht6JkL1q5zBqEiZWGpaY39URUDZF2gnLpcDfr59r/vHhv8xsiuuuuhQTr3077saEYep1fgUQRnFDOFuKqfSK5xxZv+dG1IUk5NAm6JT9WZcA/bT6BnMvfAAAA=",
    "brand": "Nike",
    "category": "Jordan",
    "color": "Grey",
    "price": 185
  },
  {
    "id": "reference-11",
    "name": "Air Jordan 4 Red",
    "image": "data:image/webp;base64,UklGRjQDAABXRUJQVlA4ICgDAADQEQCdASphAEQAPk0gi0QioiEaC6TsKATEoA0TxylAiMvIR0FKeWD3g3qt/y+9dVQ/mBVGt9FlpCDGPzt8jUBSNihupYTkpk4g0Vb56cIontdYQdqlXE1O5W4XymMKOIChr8EXnOmRxzDq2r7r10i/GRmi/vtaSKulnAxUY0K0ZQAuxcIxTCodi291Sbk6SbEHVDZrfd4gAP7+CaXSpP2poMHVvqHfVyqsgpfwx4QUkzs0ZjHQewxU41y0XXF6L9WOauzuB1IzKICL8wpsanfO5PiOTfrcNunOubK9xwaOgOir3amvH4fbY3Z+hEAYc0I01glr1ETiWjpGkXC1MOICh8K+nl0MCa4Udxn58uYr6FCyh2PxZEkYZmmUdlTV42qrSD3ICLqDZ62q27kTtPwXDWHV/uuh6MXlf0hwVuIFwpwqKEg8DvENq+RHwAdNHvI78z5PK7Dkl8B51lL49WPr6Tw9312L1tJc3bIX7fN7Py+3x61n4OzOHmRmMLAj3faS18DEPCJUkSEV+9khX4Nt0odRK9X6w1QUaOxxw7V7Shz+zYt+AjMfxz012rcGYGnGQOjAzvKxuIDFmdtdOVlOj+yUl0fYyiFLv8cXXcLke86iHZicqFWLWN5VKceKk6nOiOquww4zyLCOAO4C9kL2428dgaaLFpUz/0f6dhLvDip/zbh+lr1V018SFtC46bGQU6loXlvtG6YV7phmPbvo7sWSSyuPtKcTn7FOBzS/e+QJQ5pCO2vw/rAZE80wmST7nT2EVZyWqJ3HS0PBCFMQ27IZ8RAKkqRi31LQ51MhIXZh1G7xSmyt9dqjwPA83vXmzWuX1BiowWs/NUR76h1KYCZwdMt5NAj6IjObkI3U4AcjlnUVziG4Y7+4PdaGgMjNhnnyCLBMzdvATtayqMtfsaPkM1ouLbODPULySgShKA6YCBQx6uHcs4mbIf2kg/e1r03msuAcTmF2lwfjX801chehaLQKJ4vMBdA6dcnIwK9bPp9sKmRtLDi+n0xcsJUMEUhGAsWNN2ZQUhAoErIY6FtBASEkY9oeIq3CnqhEpNNkQATNAAAA",
    "brand": "Nike",
    "category": "Jordan",
    "color": "Red",
    "price": 205
  },
  {
    "id": "reference-12",
    "name": "Air Jordan 4 White",
    "image": "data:image/webp;base64,UklGRm4CAABXRUJQVlA4IGICAACwDwCdASpgAEQAPlEkj0SjoiGWbARwOAUEtIAJ8B+7cuCfl/peInaggsSLVraE+FeuZVHups/y1C6NWRi/3kMhBV3VHIwT0vaSD6d27kQ35//4fg6nAxO2bryFJU2A2RLRpCsdnhxtBmRfchw2DdcfaX3bFAvYbTeofDw05qLq3j0TXR/YAAD+/RTGNR2nA0q5oPjE5gDXbz5IEb+dVoMrzLw0yVZa9YNzPh7TA6efca2LxOxzSYGgtkinn8Uwld9Yjjf0lM1TcfnV69vf8pMsdeVCVpjYAnSfA4d5d3wwWlKbYPbMCx3/YnHbmQsNqFhSkh/d63It4Qems0ucC6FCXjzbezLf4dX0XnW23+t/s89PnoOmLoPL06STnDfBYOFMf80JdDwnh5B4NiCpufR/2Jcuf2OkXikyViH/i4LtkY7fe8qhZ2Oia1EdlmrOkXFFCdEl46sUxYGtKNSZbzazV9DFxG/cKpl10V1d+qXTnw3YwAi3YynNZEa9DxGjr6Fq6NNio+ShkpZQ6b/pkJXZmqnyxfn11vUUPyhZHpm9LtP7vCF2YiiQSLk+BvfKsZKC1rE1iPXCZykFdDoup6EAg8UYjcTE5jfF5xwEcDiiEESC1OvE8P8+5cYf3KqzN6uxy7BMD24Ubg0r+E7JdnDenrHojcjgJzSFh4RgwXUN33hwg+QR3T4VfrYQ7O6AI8kQCWqTZLnuSblU2R1ud686txMrMJQeYLb+UoSw+tNITlIq0zNHvNOdm/238TDj27g7ZzEtYVSIB2C5aVeKbPkuMsfaxv3ZmhU4thKtVgAFkwAA",
    "brand": "Nike",
    "category": "Jordan",
    "color": "White",
    "price": 180
  },
  {
    "id": "reference-13",
    "name": "Air Jordan 4 Black Cement",
    "image": "data:image/webp;base64,UklGRtgCAABXRUJQVlA4IMwCAABwEgCdASpjAEQAPk0gjkQioiGYq80AKATEtIAJ8Z/F8sQfo40EBz/JY9q10TQSiqjzmLfLlLVbW0vLeAzYS/BoQaCwLwyyYHQZPGzLDPNisiq5iSKSE8l84I0LaBVwGavlHPi5GP6lfcvXveEPT4TTthvMxEbXmhQzVTJ82SsViy6sfU0B8hG2LpubGOkp8a34fezR6L8przTCa6gA/vy8DojFAK+rvFLGs7g+Cx/KCa+vz8b9JcOiHyhGXlxOggCg0NSqn+nwrI0+5SVjVBP/uksRFNp3IIPCRwCtnK+ul9IuPvzMGIwu/KDbXzqFXy1TWyQnM+6Mci0MtX8pgl98Xoh6d120EK7C7HEgjN4jdY3JMsGZ8CRncz6aKkVSHchbdVaD6h4Z6UULXu4+gI16QxnE1ASvyDk9iK2pPtDPqJjenHDhpTjRL8fuAH803E4Y4GAJgNIkic9IlXim4kPloX9aBRkZTgOwv7U0M8m0kEWTcBon5hrsAQYtkS7JNmh8Sbxf7s602SlsQ9V7wLwwm3N7uIOhAdwZqNyBscBsp+5GTvqvvTRSiXI/v0BTtC11UWzUkSBhvCsixP3FDndDf9RoOf9r7iCt+bcdFUH46YBo4+tP0VzJA17HiwTX/ChojcHP+yoNYEdWx/rvuwB0tM7TGhoEVHBbGYn6I20Q64+TzCEblCekWz/i6IsUCdd1tii5KfmHO7oO8aLtcSiQgB69KsDAJsuWuFWOIOdsao0qHTumm21jAjavqbZBGMTwBfIl4ETXqaYmfePUJY6pQpvZ66kQZO3QyUxfkIzSy12Mq9sFrOHKpleIPjPK4Cx68IypB2UdSTpUMD+4LF7Q2LkD9nSEZi3f7C9bX4+sxiIUlfGmpbeC25VUAEcBPU47ytSHZ6ZALUnQjsaCJRuJwW6+t7Y3MnknmQeF3J1iFw62UrpsniN1PUAAAA==",
    "brand": "Nike",
    "category": "Jordan",
    "color": "Black",
    "price": 195
  },
  {
    "id": "reference-14",
    "name": "Air Jordan 4 Bred",
    "image": "data:image/webp;base64,UklGRggDAABXRUJQVlA4IPwCAAAwEgCdASpiAEQAPlEijkQjoiGV+xYAOAUEs4Bq33sfIUfC8aLGkEtCV1NuQbDXgPbJ37+b1oaoeJXWNL0Fk75QLsxH2ksVfjct4kL7rvao+Du+z85pxOE2tgLpNPmuForLLwdDWb3B2bUet9ncIwmHW6aV2oTtC/dNxT9Nj8NWWxNHeONbgTk8jqPu59REESpSF+3kxu6Fs04AAP79FMsu7QuKFDxbxb6TcrneYF16WdyMAmMjgCplg2lzyg5Na2rXMD/QP16eMQPFKBJT3pWc60WJk1vBjijti3XmVv9JI/VOrGzEkIoWL9Y4fzxNmCytC8zACAdHpjchqvcWO4aE710ZeCJ87qwPU+VHcfH7UXuRCmTNuG1bGc8QyQ7xZ2XKEuNXJRznrh2g0CRbhZHDfdTaPZ5fAGfc0n2DR4FzZnjIvJ7Xdg3csII21fzqTiBrB2bqb55OdXeD6bgqPX4LdoLPagayVNlaA2WrFbfEYnApVkeY9iwwPmQrdGHebEydCK1q44AizpXmffMS/kXosIwSsKNd5uqiQUv8ovE7rV7FAEB83Y2Wq+CofzYb9QGSmBDU8O5niBFQHhTzro65hljrpDRONXHP9gxBLepGvWfQw72f347P4VYPPbsfLVDuyzUuRn1TFjOCLAxXdq+tiwaQzzhLNaAfbL6djXPR4DfYfVmmZIJlyLrIRvBB9T15h3YB5dxZ+rvxysbF4HcfnnCAQWA66OK3sb0zPfa+KUDkK3OKL5uDW3BdrTbhVcFZkIo80KVkaMrBVlu7ULTOlID24ub+PW5wnuU7bUyayFhergd4luMonTBwxWVUKvbX798xA9X43l39csBdRPR0tw+f2FWFa22KrSy7QAm1JwCcz8jpDp48psECfVoRxqBITT+8afl5HMZRerc/bHEBV3EALg96+A5TRheWBYzFsgFxa1HPJtKL6MQ8ffEf/5O5/pQ9a/hWK7gbSdPDglMz2BTUZs7XjgzcrOP8HG5THc8pM6MACyXrnuAAAA==",
    "brand": "Nike",
    "category": "Jordan",
    "color": "Red",
    "price": 220
  },
  {
    "id": "new-balance",
    "name": "New Balance Running",
    "image": "data:image/webp;base64,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",
    "brand": "New Balance",
    "category": "Running",
    "color": "Blue",
    "price": 120
  }
];

function OrbitScene({ products, offset = 0, highlight = -1, staticFrame = false }: { products: readonly SneakerProduct[]; offset?: number; highlight?: number; staticFrame?: boolean }) {
  if (!products.length) return null;
  const rows = 10;
  const columns = 14;
  return <div className="so-cylinder" data-static={staticFrame} style={{ "--so-offset": `${offset}deg` } as CSSProperties} aria-hidden="true">
    {Array.from({ length: rows * columns }, (_, slot) => {
      const row = Math.floor(slot / columns);
      const index = slot % products.length;
      const product = products[index];
      const radius = Math.sqrt(1 - Math.pow((row - 4.5) / 5.8, 2));
      return <span key={slot} data-product-index={index} className="so-shoe" data-highlighted={index === highlight} style={{ "--so-angle": `${slot % columns * 360 / columns + (row % 2) * 10}deg`, "--so-y": `${(row - 4.5) * 45}px`, "--so-radius-factor": radius } as CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt="" draggable={false} />
      </span>;
    })}
  </div>;
}

function ProductDialog({ product, onClose, onBuy }: { product: SneakerProduct; onClose: () => void; onBuy?: SneakerOrbitProps["onBuy"] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  async function buy() {
    if (busy.current) return;
    busy.current = true; setPending(true); setStatus("");
    try {
      await onBuy?.(product);
      setStatus(onBuy ? `${product.name} added successfully.` : `${product.name} added to your preview bag.`);
    } catch { setStatus("Could not add this sneaker. Please try again."); }
    finally { busy.current = false; setPending(false); }
  }
  return <dialog ref={dialog} className="so-dialog" aria-labelledby={`${id}-title`} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="so-dialog-content">
      <button type="button" className="so-close" onClick={onClose} aria-label="Close product">×</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="so-selected-image" src={product.image} alt={product.name} />
      <h2 id={`${id}-title`}>{product.name}</h2>
      <p className="so-price">${product.price.toFixed(0)}</p>
      <button type="button" className="so-buy" onClick={buy} disabled={pending}>{pending ? "Adding…" : "Buy Now"}</button>
      <p className="so-purchase-status" role="status">{status}</p>
    </div>
  </dialog>;
}

/** A rotating sneaker catalog. Drag, use arrow keys, or pick a sneaker to inspect it. */
export default function SneakerOrbit({ products = PRODUCTS, autoRotate = true, onBuy, className = "" }: SneakerOrbitProps) {
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("All");
  const [under150, setUnder150] = useState(false);
  const [color, setColor] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [paused, setPaused] = useState(!autoRotate);
  const [offset, setOffset] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [keyboardActive, setKeyboardActive] = useState(false);
  const [selected, setSelected] = useState<SneakerProduct | null>(null);
  const gesture = useRef<{ x: number; offset: number; moved: boolean; productIndex: number | null } | null>(null);
  const ignoreClick = useRef(false);
  const id = useId();
  const filtered = products.filter((product) => (!brand || product.brand === brand) && (category === "All" || product.category === category) && (!under150 || product.price < 150) && (!color || product.color === color));
  const activeIndex = filtered.length ? ((cursor % filtered.length) + filtered.length) % filtered.length : 0;
  const active = filtered[activeIndex];
  const colors = Array.from(new Set(products.map((product) => product.color)));
  const brands = Array.from(new Set(products.map((product) => product.brand)));
  const categories = ["All", ...Array.from(new Set(products.map((product) => product.category)))];

  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const tile = (event.target as HTMLElement).closest<HTMLElement>("[data-product-index]");
    gesture.current = { x: event.clientX, offset, moved: false, productIndex: tile ? Number(tile.dataset.productIndex) : null };
    ignoreClick.current = false;
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!gesture.current) return;
    if (event.pointerType !== "touch" && event.buttons === 0) { gesture.current = null; return; }
    const distance = event.clientX - gesture.current.x;
    if (Math.abs(distance) > 5) {
      gesture.current.moved = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
      setOffset(gesture.current.offset + distance * .35);
      setKeyboardActive(false);
    }
  }
  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!gesture.current) return;
    ignoreClick.current = gesture.current.moved;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    gesture.current = null;
  }
  function reset() { setBrand(""); setCategory("All"); setUnder150(false); setColor(""); setCursor(0); }

  return <section className={`sneaker-orbit relative w-full overflow-hidden ${className}`} aria-label="Sneaker orbit catalog">
    <style>{STYLES}</style>
    <button type="button" className="so-stage" data-paused={paused || Boolean(selected)} aria-describedby={`${id}-instructions`} aria-label={active ? `Inspect ${active.name}. Use left and right arrow keys to choose a sneaker.` : "No sneakers match these filters"} disabled={!filtered.length}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerLeave={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) gesture.current = null; }} onPointerCancel={() => { gesture.current = null; ignoreClick.current = true; }}
      onClick={(event) => {
        if (ignoreClick.current) { ignoreClick.current = false; return; }
        const tile = (event.target as HTMLElement).closest<HTMLElement>("[data-product-index]");
        const product = tile ? filtered[Number(tile.dataset.productIndex)] : active;
        if (product) setSelected(product);
      }}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !filtered.length) return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? filtered.length - 1 : (activeIndex + (event.key === "ArrowRight" ? 1 : -1) + filtered.length) % filtered.length;
        setCursor(next); setOffset((value) => value + (event.key === "ArrowLeft" ? 360 / 14 : -360 / 14)); setKeyboardActive(true);
      }}>
      {filtered.length ? <OrbitScene products={filtered} offset={offset} highlight={keyboardActive ? activeIndex : -1} /> : <span className="so-empty">No sneakers match your filters.</span>}
    </button>
    <p className="so-sr" id={`${id}-instructions`}>Drag to rotate. Use arrow keys to choose, then Enter to inspect. Additional filters include a product list.</p>
    <div className="so-tools">
      <div className="so-toolbar" aria-label="Catalog filters">
        <button type="button" className="so-more" aria-expanded={filtersOpen} aria-controls={`${id}-filters`} aria-label={filtersOpen ? "Hide additional filters" : "Show additional filters"} onClick={() => setFiltersOpen((value) => !value)}>{filtersOpen ? "−" : "+"}</button>
        {brands.map((item) => <button type="button" key={item} aria-pressed={brand === item} onClick={() => { setBrand(brand === item ? "" : item); setCursor(0); }}>{item}</button>)}
        <button type="button" aria-pressed={under150} onClick={() => { setUnder150((value) => !value); setCursor(0); }}>Under $150</button>
        <span className="so-divider" />
        {categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => { setCategory(item); setCursor(0); }}>{item}</button>)}
      </div>
      <button type="button" className="so-motion" aria-label={paused ? "Start rotation" : "Pause rotation"} aria-pressed={paused} onClick={() => setPaused((value) => !value)}>{paused ? "▶" : "Ⅱ"}</button>
    </div>
    <div className="so-additional" id={`${id}-filters`} hidden={!filtersOpen}>
      <label>Color<select value={color} onChange={(event) => { setColor(event.target.value); setCursor(0); }}><option value="">All colors</option>{colors.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Sneaker<select value={active?.id ?? ""} onChange={(event) => { const index = filtered.findIndex((item) => item.id === event.target.value); if (index >= 0) { setCursor(index); setSelected(filtered[index]); } }} disabled={!filtered.length}><option value="" disabled>{filtered.length ? "Choose a sneaker" : "No matching sneakers"}</option>{filtered.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button type="button" onClick={() => { if (active) setSelected(active); }} disabled={!active}>Inspect</button>
      <button type="button" onClick={reset}>Reset filters</button>
    </div>
    {!filtered.length && <button className="so-reset" type="button" onClick={reset}>Reset filters</button>}
    <span className="so-sr" role="status">{filtered.length} sneakers match. {keyboardActive && active ? active.name : ""}</span>
    {selected && <ProductDialog key={selected.id} product={selected} onClose={() => setSelected(null)} onBuy={onBuy} />}
  </section>;
}

export function SneakerOrbitThumbnail({ className = "", previewStep = 0 }: { className?: string; previewStep?: number }) {
  const step = Math.abs(Math.trunc(previewStep)) % 4;
  const products = step === 2 ? PRODUCTS.filter((product) => product.category === "Jordan") : PRODUCTS;
  return <div className={`sneaker-orbit so-thumbnail ${className}`} aria-hidden="true" inert><style>{STYLES}</style>
    <div className="so-stage" data-paused="true"><OrbitScene products={products} offset={step * 17} staticFrame /></div>
    {step === 3 && <div className="so-static-focus">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PRODUCTS[7].image} alt="" /><span>{PRODUCTS[7].name}</span><small>${PRODUCTS[7].price}</small><b>Buy Now</b>
    </div>}
    <div className="so-tools"><div className="so-toolbar"><span>＋</span><span>Nike</span><span>New Balance</span><span>Under $150</span><span className="so-divider" /><span className={step === 2 ? "" : "so-active"}>All</span><span className={step === 2 ? "so-active" : ""}>Jordan</span><span>Dunk</span></div></div>
  </div>;
}

const STYLES = `
@property --so-turn{syntax:"<angle>";inherits:true;initial-value:0deg}
.sneaker-orbit{container-type:inline-size;position:relative;min-height:640px;background:#eee;color:#151515;font-family:Arial,Helvetica,sans-serif;isolation:isolate}
.sneaker-orbit *,.so-dialog *{box-sizing:border-box}
.so-stage{position:absolute;inset:0 0 66px;display:block;width:100%;border:0;background:transparent;padding:0;perspective:950px;cursor:grab;touch-action:pan-y;overflow:hidden;color:inherit;-webkit-tap-highlight-color:transparent}
.so-stage:active{cursor:grabbing}.so-stage:focus-visible{outline:2px solid #444;outline-offset:-8px;border-radius:18px}
.so-cylinder{--so-turn:0deg;--so-radius:min(26cqw,172px);position:absolute;top:50%;left:50%;width:0;height:0;transform-style:preserve-3d;transform:rotateY(calc(var(--so-turn) + var(--so-offset)));animation:so-revolve 75s linear infinite}
.so-shoe{position:absolute;top:-22px;left:-35px;width:70px;height:44px;display:grid;place-items:center;transform-style:preserve-3d;transform:translateY(var(--so-y)) rotateY(var(--so-angle)) translateZ(calc(var(--so-radius) * var(--so-radius-factor))) rotateY(calc(-1 * (var(--so-angle) + var(--so-turn) + var(--so-offset))));opacity:clamp(.08,calc(.3 + cos(var(--so-angle) + var(--so-turn) + var(--so-offset)) * .85),1);transition:filter .15s}
.so-shoe img{display:block;pointer-events:none;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;user-select:none;-webkit-user-drag:none}
.so-shoe:hover,.so-shoe[data-highlighted="true"]{filter:drop-shadow(0 0 3px #3877bf)}
.so-stage[data-paused="true"] .so-cylinder,.so-stage:hover .so-cylinder,.so-stage:focus-visible .so-cylinder,.so-cylinder[data-static="true"]{animation-play-state:paused}
.so-tools{position:absolute;bottom:24px;left:20px;right:20px;display:flex;align-items:center;justify-content:center;gap:9px}
.so-toolbar{display:flex;align-items:center;justify-content:center;gap:5px;padding:5px 9px;border:1px solid #fff8;border-radius:40px;background:#f6f6f6;box-shadow:0 4px 10px #8881;max-width:100%;flex-wrap:wrap}
.so-toolbar button,.so-toolbar>span:not(.so-divider){border:0;background:transparent;border-radius:20px;min-height:30px;padding:5px 8px;color:#8c8c8c;font:10px/1.1 Arial,sans-serif;white-space:nowrap;cursor:pointer}
.so-toolbar button[aria-pressed="true"],.so-toolbar .so-active{background:#171717!important;color:white!important}
.so-toolbar .so-more{font-size:18px;color:#222;min-width:28px;padding:0}
.so-divider{height:14px;width:1px;background:#dedede;margin:0 2px}
.so-motion{width:30px;height:30px;flex:0 0 30px;border:1px solid #e2e2e2;border-radius:50%;background:#f8f8f8;color:#666;font-size:11px;cursor:pointer}
.sneaker-orbit button:focus-visible,.sneaker-orbit select:focus-visible,.so-dialog button:focus-visible{outline:2px solid #3377a5;outline-offset:3px}
.so-motion:disabled{opacity:.4;cursor:default}
.so-additional{position:absolute;z-index:5;left:50%;bottom:84px;transform:translateX(-50%);width:min(430px,calc(100% - 32px));padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#fff;border:1px solid #ddd;border-radius:18px;box-shadow:0 16px 40px #0002}
.so-additional[hidden]{display:none}.so-additional label{font-size:11px;display:grid;gap:7px}.so-additional label:nth-child(2){min-width:0}.so-additional select{max-width:100%;width:100%;height:35px;border:1px solid #ddd;border-radius:7px;background:#fafafa;padding:0 7px;font:11px Arial,sans-serif;color:#222}
.so-additional>button{min-height:34px;border:1px solid #ddd;border-radius:20px;background:#f6f6f6;color:#333;font:11px Arial,sans-serif;cursor:pointer}
.so-additional>button:disabled{opacity:.4;cursor:default}.so-empty{display:block;padding:24px;font-size:14px;color:#666}.so-reset{position:absolute;top:53%;left:50%;transform:translateX(-50%);border:0;border-bottom:1px solid #999;background:transparent;padding:6px;color:#444;cursor:pointer}
.so-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.so-dialog{position:fixed;inset:0;width:min(640px,calc(100vw - 28px));height:540px;max-height:calc(100dvh - 36px);margin:auto;border:0;padding:0;border-radius:24px;background:#f0f0f0ed;color:#111;box-shadow:0 30px 120px #0002;font-family:Arial,Helvetica,sans-serif;overflow:auto}
.so-dialog::backdrop{background:#eeeeeeba;backdrop-filter:blur(2px)}
.so-dialog-content{position:relative;min-height:100%;padding:76px 30px 30px;text-align:center;display:flex;align-items:center;flex-direction:column}
.so-close{position:absolute;top:18px;right:20px;width:32px;height:32px;border:0;border-radius:50%;background:#fff;color:#777;font-size:23px;cursor:pointer}
.so-selected-image{display:block;width:290px;max-width:100%;height:200px;object-fit:contain;mix-blend-mode:multiply;filter:drop-shadow(0 12px 8px #00000007);animation:so-arrive .4s ease-out}
.so-dialog h2{font-size:13px;font-weight:400;line-height:1.5;margin:12px 0 5px;max-width:360px}.so-price{font-size:11px;color:#999;margin:0 0 45px}.so-buy{border:0;border-radius:40px;min-height:38px;padding:10px 24px;background:#111;color:white;font:bold 11px Arial,sans-serif;cursor:pointer}.so-buy:disabled{opacity:.5;cursor:wait}.so-purchase-status{max-width:330px;min-height:34px;font-size:12px;color:#595959;line-height:1.5;margin:18px 0 0}
.so-thumbnail{min-height:0;height:100%;overflow:hidden}.so-thumbnail .so-stage{bottom:30px;perspective:700px}.so-thumbnail .so-cylinder{scale:.5;--so-radius:172px;transition:transform 1s ease}.so-thumbnail .so-shoe{transition:transform 1s ease,opacity 1s ease}.so-thumbnail .so-tools{bottom:10px;left:5px;right:5px}.so-thumbnail .so-toolbar{padding:2px 4px;gap:1px}.so-thumbnail .so-toolbar>span:not(.so-divider){min-height:0;font-size:1.6cqw;padding:3px 4px}.so-thumbnail .so-divider{height:7px}.so-static-focus{position:absolute;inset:0 0 32px;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#eeeeeeda;font-size:2cqw}.so-static-focus img{width:38%;height:90px;object-fit:contain;mix-blend-mode:multiply}.so-static-focus small{margin-top:4px;color:#888}.so-static-focus b{font-size:1.9cqw;border-radius:20px;background:#111;color:#fff;padding:5px 9px;margin-top:22px}
@keyframes so-revolve{to{--so-turn:360deg}}
@keyframes so-arrive{from{opacity:0;transform:scale(.65)}to{opacity:1;transform:scale(1)}}
@container(max-width:440px){.sneaker-orbit:not(.so-thumbnail) .so-cylinder{--so-radius:136px;scale:.86}.sneaker-orbit:not(.so-thumbnail) .so-tools{left:8px;right:8px;gap:4px}.sneaker-orbit:not(.so-thumbnail) .so-toolbar{gap:1px;padding:5px}.sneaker-orbit:not(.so-thumbnail) .so-toolbar button{font-size:9px;padding:5px}.sneaker-orbit:not(.so-thumbnail) .so-motion{width:26px;flex-basis:26px}}
@media(prefers-reduced-motion:reduce){.sneaker-orbit *,.so-dialog *{animation:none!important;transition:none!important}}
`;

/* Embedded New Balance demonstration image: PNGimg.com, https://pngimg.com/image/5792
   License: CC BY-NC 4.0, https://creativecommons.org/licenses/by-nc/4.0/
   Modified by cropping transparent margins, resizing, and converting to WebP.
   Other default product photos are low-resolution crops from the supplied reference video. */
