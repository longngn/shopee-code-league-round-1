import fs = require("fs");
import process = require("process");
import sortBy from "lodash/sortBy";
import orderBy from "lodash/orderBy";
import uniq from "lodash/uniq";

const EPS = 0.0001;

interface ShopOrder {
  orderId: string;
  buyerId: string;
  eventTimeRaw: string;
  eventTime: Date;
}

const isOutOfWindow = (d1: Date, d2: Date): boolean => {
  const t1 = d1.getTime();
  const t2 = d2.getTime();
  const diff = Math.abs(t1 - t2); // in millisecond
  const inHour = diff / 1000 / 60 / 60;
  return inHour > 1;
};

const file: string = fs.readFileSync("./order_brush_order.csv", "utf8");
const lines: string[] = file.split("\n").slice(1); // remove header row
const shops: { [shopId: string]: ShopOrder[] } = {};
lines.forEach((line) => {
  const cells: string[] = line.split(",");
  if (cells.length !== 4) {
    console.error("wtf parse wrong");
    process.exit(1);
  }
  const [orderId, shopId, buyerId, eventTimeRaw] = cells;
  if (!shops[shopId]) {
    shops[shopId] = [];
  }
  shops[shopId].push({
    orderId,
    buyerId,
    eventTimeRaw,
    eventTime: new Date(eventTimeRaw),
  });
});

if (Object.keys(shops).length !== 18770) {
  console.error(`wtf wrong number of shop, expect 18770 got ${Object.keys(shops).length}`);
  process.exit(1);
}

const cheatingShops: { [shopId: string]: string[] } = {};

for (const shopId in shops) {
  let shopOrders = shops[shopId];
  shopOrders = sortBy(shopOrders, "eventTime");
  let queue: ShopOrder[] = [];
  // console.log(shopId, " ", shopOrders);
  for (const order of shopOrders) {
    while (queue.length > 0 && isOutOfWindow(queue[0].eventTime, order.eventTime)) {
      queue = queue.slice(1);
    }
    queue.push(order);
    const buyers: { [id: string]: number } = {};
    queue.forEach((o) => (buyers[o.buyerId] = 0));
    const conRate = queue.length / Object.keys(buyers).length;
    if (conRate < 3) {
      // console.log(shopOrders);
      continue;
    }
    for (const id in buyers) {
      const orderByThisBuyer = queue.filter((o) => o.buyerId === id).length;
      buyers[id] = orderByThisBuyer / queue.length;
    }
    let tmp: { id: string; score: number }[] = Object.entries(buyers).map(([k, v]) => ({
      id: k,
      score: v,
    }));
    tmp = orderBy(tmp, ["score"], ["desc"]);
    tmp = tmp.filter((x) => Math.abs(x.score - tmp[0].score) <= EPS);
    if (!cheatingShops[shopId]) {
      cheatingShops[shopId] = [];
    }
    cheatingShops[shopId] = cheatingShops[shopId].concat(tmp.map((x) => x.id).sort());
  }
}

fs.writeFileSync("answer.csv", "shopid,userid\n");
for (const sid in shops) {
  let val = "0";
  if (cheatingShops[sid]) {
    val = uniq(cheatingShops[sid]).sort().join("&");
  }
  fs.appendFileSync("answer.csv", `${sid},${val}\n`);
}
