import fs = require("fs");
import process = require("process");

interface ShopOrder {
  orderId: string;
  buyerId: string;
  eventTimeRaw: string;
}

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
  });
});

if (Object.keys(shops).length !== 18770) {
  console.error(`wtf wrong number of shop, expect 18770 got ${Object.keys(shops).length}`);
  process.exit(1);
}

fs.writeFileSync("answer.csv", "shopid,userid\n");
Object.entries(shops).forEach(([shopId, _]) => {
  fs.appendFileSync("answer.csv", `${shopId},0\n`);
});
