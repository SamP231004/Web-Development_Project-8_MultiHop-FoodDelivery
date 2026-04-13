export const getRoute = async (points: [number, number][]) => {
    const coords = points
        .map(([lat, lng]) => `${lng},${lat}`)
        .join(";");

    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    return data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
    );
};