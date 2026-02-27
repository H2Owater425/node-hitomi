export type URL = [string/* hostname */, string/* path */];

export type Node = [Buffer[]/* keys */, [bigint/* offset */, number/* length */][]/* datas */, bigint[]/* subnodeAddresses */];

export type ImageContext = [Set<number>/* subdomainCodes */, boolean/* isSuffix2 */, string/* pathCode */];