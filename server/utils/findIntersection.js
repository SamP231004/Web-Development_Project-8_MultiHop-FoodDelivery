export const findIntersection = (routeX, routeY) => {
    let best = null;
    let minDist = Infinity;

    for (const p1 of routeX) {
        for (const p2 of routeY) {
            const d = distance(p1, p2);

            if (d < minDist) {
                minDist = d;
                best = {
                    lat: (p1.lat + p2.lat) / 2,
                    lng: (p1.lng + p2.lng) / 2,
                };
            }
        }
    }

    return best;
};

const distance = (a, b) => {
    return Math.sqrt(
        Math.pow(a.lat - b.lat, 2) +
        Math.pow(a.lng - b.lng, 2)
    );
};