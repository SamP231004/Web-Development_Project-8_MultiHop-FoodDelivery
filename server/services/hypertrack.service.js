import axios from "axios";

const BASE_URL = "https://v3.api.hypertrack.com";

const getAuthHeader = () => {
    return (
        "Basic " +
        Buffer.from(process.env.HYPERTRACK_SECRET_KEY + ":").toString("base64")
    );
};

export const createDevice = async (name) => {
    try {
        const res = await axios.post(
            `${BASE_URL}/devices`,
            { name },
            {
                headers: {
                    Authorization: getAuthHeader(),
                    "Content-Type": "application/json",
                },
            }
        );

        return res.data;
    } catch (err) {
        console.error("HyperTrack Error:", err.response?.data || err.message);
        throw err;
    }
};