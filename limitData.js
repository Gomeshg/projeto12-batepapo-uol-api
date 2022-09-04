export default function limitData(limit, data) {
  if (!limit) {
    return data;
  }
  if (limit >= data) {
    return data;
  }
  if (limit < data) {
    return data.slice(data.length - limit, data.length);
  }
}
