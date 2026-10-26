const KEY = "90bc29eb-723e-4a0b-b17e-16ad77c08d23";
const ids = ["mercure", "venus", "terre", "mars", "jupiter", "saturne", "uranus", "neptune"];

(async () => {
    const out = {};
    for (const id of ids) {
        const res = await fetch(`https://api.le-systeme-solaire.net/rest/bodies/${id}`, {
            headers: { Authorization: `Bearer ${KEY}` },
        });
        out[id] = await res.json();
    }
    require("fs").writeFileSync("planets.json", JSON.stringify(out, null, 2));
    console.log("done");
})();