import { useState } from "react";
import { createOrder } from "./services/api";

function App() {
  const [result, setResult] = useState(null);

  const handleCreate = async () => {
    const res = await createOrder({
      restaurant: { lat: 12.9716, lng: 77.5946 },
      customer: { lat: 12.9352, lng: 77.6245 },
    });

    setResult(res.data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Multi-Hop Delivery</h1>

      <button onClick={handleCreate}>
        Create Order
      </button>

      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export default App;