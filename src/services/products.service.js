import { getDataAPI } from "../lib/axios";

// GET /products — public, no auth
// Response 200: { data: [ { _id, name, noOfSlots, totalValue, quantity, category, emoji, pricePerSlot } ] }
export const getProducts = () => getDataAPI("/products").then((r) => r.data);
