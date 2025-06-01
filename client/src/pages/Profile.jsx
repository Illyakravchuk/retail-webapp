import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Box, Grid, CircularProgress, MenuItem, Select,
  Typography, Avatar, Chip, IconButton, Tooltip, Paper, Snackbar
} from "@mui/material";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MuiAlert from '@mui/material/Alert';

import StoreCard from "../components/StoreCard";
import ProductCard from "../components/ProductCard";
import SaleCard from "../components/SaleCard";
import EmployeeCard from "../components/EmployeeCard";

const ROLE_UA = {
  admin: "Адміністратор",
  cashier: "Касир",
  user: "Користувач"
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error"
  });

  const showSnackbar = (message, severity = "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const fileInputRef = useRef();
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data: { user } } = await axios.get("http://localhost:3000/profile", auth);
        setUser(user);
        const { data: allStores } = await axios.get("http://localhost:3000/stores", auth);
        setStores(allStores);
        // Для admin — перший магазин активний, для інших — усі магазини
        if (user.role === "admin") setActiveId(allStores[0]?.id ?? null);
        else setActiveId(0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    const query = activeId && activeId !== 0
      ? { params: { storeId: activeId }, ...auth }
      : auth;
    (async () => {
      try {
        const promises = [axios.get("http://localhost:3000/products", query)];
        if (user.role === "admin") {
          promises.push(
            axios.get("http://localhost:3000/sales", query),
            axios.get("http://localhost:3000/employees", query)
          );
        }
        const [prRes, slRes, emRes] = await Promise.all(promises);
        setProducts(prRes.data);
        setSales(slRes?.data ?? []);
        setEmployees(emRes?.data ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [activeId, user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await axios.post('http://localhost:3000/profile/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      const { data: { user } } = await axios.get("http://localhost:3000/profile", auth);
      setUser(user);
    } catch (err) {
      showSnackbar("Помилка при завантаженні аватарки", "error");
    } finally {
      setUploading(false);
    }
  };

  if (loading || !user)
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );

  const showFirstName = user.firstName?.trim() || "";
  const showLastName = user.lastName?.trim() || "";
  const avatarUrl = user.avatarUrl
    ? (user.avatarUrl.startsWith("http") ? user.avatarUrl : `http://localhost:3000${user.avatarUrl}`)
    : undefined;

  return (
    <Box sx={{
      bgcolor: "#f5f6fa",
      minHeight: "100vh",
      py: { xs: 2, md: 8 },
      px: { xs: 0, md: 4 },
    }}>
      {/* ------- profile header ---------- */}
      <Paper elevation={6} sx={{
        mb: 4,
        borderRadius: 4,
        p: { xs: 2, md: 4 },
        display: "flex",
        alignItems: "center",
        gap: 4,
        bgcolor: "#fff8ee",
        flexWrap: { xs: "wrap", md: "nowrap" },
      }}>
        {/* Аватар і кнопка */}
        <Box position="relative" display="flex" flexDirection="column" alignItems="center">
          <Avatar
            src={avatarUrl}
            sx={{
              bgcolor: "primary.main",
              width: 120, height: 120, fontSize: 60,
              boxShadow: 3,
              border: "4px solid #fff",
            }}
          >
            {(showFirstName[0] || user.email[0] || "U").toUpperCase()}
          </Avatar>
          <Tooltip title="Змінити аватар">
            <IconButton
              size="medium"
              sx={{
                position: "absolute",
                bottom: 10,
                right: 10,
                bgcolor: "#fff",
                boxShadow: 2,
                "&:hover": { bgcolor: "grey.200" },
                border: "2px solid #eee"
              }}
              component="span"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <CameraAltIcon fontSize="medium" color="action" />
            </IconButton>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </Box>
        {/* Інформація про користувача */}
        <Box flex={1} minWidth={0}>
          <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
            {`Привіт, ${showFirstName || user.email || "користувачу"}!`}
          </Typography>
          <Box mb={1} display="flex" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>ПІБ:&nbsp;</Typography>
            <Typography variant="h6" sx={{ display: "inline", mr: 2 }}>
              {(showLastName + " " + showFirstName).trim() || "—"}
            </Typography>
            <Chip
              label={ROLE_UA[user.role] || user.role}
              color={
                user.role === "admin" ? "primary" :
                  user.role === "cashier" ? "success" : "default"
              }
              size="small"
              sx={{ fontWeight: 600, fontSize: 15, height: 28 }}
            />
          </Box>
          <Box mb={1} display="flex" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>Email:&nbsp;</Typography>
            <Typography variant="h6" sx={{ display: "inline" }}>{user.email}</Typography>
          </Box>
          <Box mb={1} display="flex" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>Магазин:&nbsp;</Typography>
            <Select
              size="small"
              value={activeId}
              onChange={e => setActiveId(Number(e.target.value))}
              sx={{
                bgcolor: "#fff",
                borderRadius: 2,
                minWidth: 170,
                maxWidth: 280,
                fontSize: 16,
                ml: 1,
              }}
            >
              <MenuItem value={0}>Усі магазини</MenuItem>
              {stores.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </Paper>

      {/* ------- cards -------------------- */}
      <Grid container spacing={4}>
        {/* Всі бачать магазини (read only для cashier/user) */}
        <Grid item xs={12}>
          <StoreCard
            rows={stores}
            setRows={setStores}
            auth={auth}
            userRole={user.role}
          />
        </Grid>
        {/* Товари бачать всі */}
        <Grid item xs={12}>
          <ProductCard
            rows={products}
            setRows={setProducts}
            auth={auth}
            storeId={activeId === 0 ? null : activeId}
            userRole={user.role}
            userStore={user.storeId}
          />
        </Grid>
        {/* Інші картки — лише для адміна */}
        {user.role === "admin" && (
          <>
            <Grid item xs={12}>
              <SaleCard rows={sales} setRows={setSales} auth={auth} storeId={activeId} />
            </Grid>
            <Grid item xs={12}>
              <EmployeeCard rows={employees} setRows={setEmployees} auth={auth} storeId={activeId} />
            </Grid>
          </>
        )}
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
