const distance = (lat1, lng1, lat2, lng2) => {
    return Math.sqrt(
        Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)
    );
};

export const findBestAgents = (agents, pickup, drop) => {
    const list = Array.from(agents.entries());

    if (list.length < 2) return null;

    let bestX = null;
    let bestY = null;

    let minPickup = Infinity;
    let minDrop = Infinity;

    for (const [id, data] of list) {
        if (!data.location) continue;

        const d1 = distance(data.location.lat, data.location.lng, pickup.lat, pickup.lng);
        const d2 = distance(data.location.lat, data.location.lng, drop.lat, drop.lng);

        if (d1 < minPickup) {
            minPickup = d1;
            bestX = { id, ...data };
        }

        if (d2 < minDrop) {
            minDrop = d2;
            bestY = { id, ...data };
        }
    }

    if (!bestX || !bestY || bestX.id === bestY.id) return null;

    return { X: bestX, Y: bestY };
};

export const findHandoffPoint = (X, Y) => ({
    lat: (X.location.lat + Y.location.lat) / 2,
    lng: (X.location.lng + Y.location.lng) / 2,
});