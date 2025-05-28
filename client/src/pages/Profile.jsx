import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Container, Card, CardHeader, CardContent,
  Grid, Typography, Divider, CircularProgress
} from "@mui/material";

import StoreCard     from "../components/StoreCard";
import ProductCard   from "../components/ProductCard";
import SaleCard      from "../components/SaleCard";
import EmployeeCard  from "../components/EmployeeCard";   

export default function Profile() {
  const [user,       setUser]       = useState(null);
  const [stores,     setStores]     = useState([]);
  const [products,   setProducts]   = useState([]);
  const [sales,      setSales]      = useState([]);
  const [employees,  setEmployees]  = useState([]);       
  const [loading,    setLoading]    = useState(true);

  const token = localStorage.getItem("token");
  const auth  = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const { data:{ user } } = await axios.get("http://localhost:3000/profile", auth);
        setUser(user);

        if (user.role === "admin") {
          const [stRes, prRes, slRes, emRes] = await Promise.all([
            axios.get("http://localhost:3000/stores"   , auth),
            axios.get("http://localhost:3000/products" , auth),
            axios.get("http://localhost:3000/sales"    , auth),
            axios.get("http://localhost:3000/employees", auth)   
          ]);
          setStores   (stRes.data);
          setProducts (prRes.data);
          setSales    (slRes.data);
          setEmployees(emRes.data);

        } else if (user.role === "cashier") {
          const prRes = await axios.get("http://localhost:3000/products", auth);
          setProducts(prRes.data);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !user) {
    return (
      <Box sx={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor:"#f5f6fa", minHeight:"100vh", py:8 }}>
      <Box sx={{ px: 4 }}>
        <Card sx={{ mb:4, boxShadow:3 }}>
          <CardHeader title="Профіль користувача" />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1"><b>Email:</b> {user.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1"><b>Роль:</b> {user.role}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={4} justifyContent="center">
          {user.role === "admin" && (
            <Grid item xs={12}>
              <StoreCard rows={stores} setRows={setStores} auth={auth} />
            </Grid>
          )}

          {(user.role === "admin" || user.role === "cashier") && (
            <Grid item xs={12}>
              <ProductCard rows={products} setRows={setProducts} auth={auth} />
            </Grid>
          )}

          {user.role === "admin" && (
            <Grid item xs={12}>
              <SaleCard rows={sales} setRows={setSales} auth={auth} />
            </Grid>
          )}

          {user.role === "admin" && (
            <Grid item xs={12}>
              <EmployeeCard rows={employees} setRows={setEmployees} auth={auth} />
            </Grid>
          )}
        </Grid>
        </Box>
    </Box>
  );
}
