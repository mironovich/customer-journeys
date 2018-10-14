// TODO: percentage (Other), prettify

const CONFIG = {
  DEPTH: 5,
  CSV: [
    // './r/results/test.1.csv',
    // './r/results/test.2.csv',
    { TYPE: 'Category Listing', PATH: './r/results/catalog.csv' },
    { TYPE: 'Product Detail', PATH: './r/results/product.csv' },
    { TYPE: 'Home', PATH: './r/results/home.csv' },
    { TYPE: 'Cart', PATH: './r/results/cart.csv', FILTER: true },
    { TYPE: 'Search Listing', PATH: './r/results/search.csv', FILTER: true },
  ],
  NAMES: {
    CID: 'dimension1',
    TIME: 'dimension8',
    PAGE: 'contentGroup2',
  },

  JSON: './routes.json',
  MAX: 5,
}

const DEBUG = false

const csv = require('csv-parser')
const fs = require('fs')
let client = [],
  tree = []

const compareTimeStamp = (a, b) => {
  const v = CONFIG.NAMES.TIME
  if (a[v] < b[v]) return -1
  if (a[v] > b[v]) return 1
  return 0
}

const compareWeight = (a, b) => {
  const v = 'pc'
  if (a[v] > b[v]) return -1
  if (a[v] < b[v]) return 1
  return 0
}

const route = (row, type, filter) => {
  if (client.length && client[0][CONFIG.NAMES.CID] !== row[CONFIG.NAMES.CID]) {
    client.sort(compareTimeStamp)
    client[0][CONFIG.NAMES.PAGE] === type && addNode(client)
    DEBUG && console.log('=== CLIENT')
    DEBUG && console.log(client[0])
    client = []
  }
  if (!filter) {
    if (client.length < CONFIG.DEPTH && row[CONFIG.NAMES.PAGE]) {
      client.push(row)
    }
  } else if (
    client.length &&
    client.length < CONFIG.DEPTH &&
    row[CONFIG.NAMES.PAGE]
  ) {
    client.push(row)
  } else if (row[CONFIG.NAMES.PAGE] === type) {
    client.push(row)
  }
}

const addNode = (route, node = tree, step = 0) => {
  try {
    let branch = searchBranch(node, route[step][CONFIG.NAMES.PAGE])
    if (!branch.name) {
      branch = {
        name: route[step][CONFIG.NAMES.PAGE],
        views: 1,
        children: [],
      }
      node.push(branch)
    } else {
      if (!branch.children) {
        branch.children = []
      }
      branch.views++
    }

    if (++step < route.length) {
      addNode(route, branch.children, step)
    }
  } catch (e) {
    console.log(e)
  }
}

const searchBranch = (node, value, key = 'name') => {
  try {
    for (let i = 0; i < node.length; i++) {
      if (node[i][key] === value) {
        return node[i]
      }
    }
    return {}
  } catch (e) {
    console.log(e)
  }
}

const percentage = node => {
  if (node.length) {
    const sum = node.reduce((s, c) => s + c.views, 0)
    node.map(branch => {
      branch.pc = Math.round((branch.views / sum) * 10000) / 100
      return branch.children !== null && percentage(branch.children)
    })
    node.sort(compareWeight)
    node.splice(CONFIG.MAX)
    const other =
      Math.round((100 - node.reduce((s, c) => s + c.pc, 0)) * 100) / 100
    other &&
      node.push({
        name: 'Other',
        pc: other,
      })
  }
}

const growTree = async file => {
  tree = []
  return new Promise(function(resolve, reject) {
    fs.createReadStream(file.PATH)
      .pipe(csv())
      .on('data', row => {
        route(row, file.TYPE, file.FILTER)
      })
      .on('end', () => {
        route({}, file.TYPE, file.FILTER)
        resolve(tree)
      })
  })
}

let forest = []

const pr = CONFIG.CSV.reduce(
  (p, seed) =>
    p.then(
      _ =>
        new Promise(async resolve => {
          const tree = await growTree(seed)
          forest.push(...tree)
          resolve()
        })
    ),
  Promise.resolve()
)

pr.then(() => {
  percentage(forest)
  DEBUG && console.log('=== FOREST')
  DEBUG && console.log(JSON.stringify(forest))
  fs.writeFile(
    CONFIG.JSON,
    JSON.stringify({ name: 'Routes', children: forest }),
    err => {
      if (err) throw err
      console.log('The file was succesfully saved!')
    }
  )
})
