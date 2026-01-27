module.exports = (req, res) => {
  // Always return 200 with an empty array for "no activity yet"
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify([]));
};
