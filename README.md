const version = await nodeVersionAlias("lts");
console.log(`Using Node.js ${version}`);

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
