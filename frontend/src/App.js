import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/users")
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError("Error al obtener los usuarios");
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Usuarios</h1>

      {loading && <p>Cargando usuarios...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && data.length === 0 && <p>No hay usuarios registrados.</p>}

      <ul>
        {data.map(user => (
          <li key={user.id}>
            {user.username} - {user.email}  
            {user.profile_picture && (
              <img 
                src={user.profile_picture} 
                alt="Foto de perfil" 
                width="50" 
                height="50"
                style={{ borderRadius: "50%", marginLeft: "10px" }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
