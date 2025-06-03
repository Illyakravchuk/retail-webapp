import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card, CardHeader, Divider, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function SaleCard({ rows, setRows, auth, storeId }) {
  const [products, setProducts] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);

  const blank = { id: null, productId: "", quantity: "", total: 0 };
  const [cur, setCur] = useState(blank);

  useEffect(() => { if (storeId) refreshData(); }, [storeId]);
  const reset = () => setCur(blank);

  async function handleSave() {
    const productId = Number(cur.productId);
    const quantity = Number(cur.quantity);
    const body = { productId, quantity };

    try {
      if (cur.id == null) {
        await axios.post("http://localhost:3000/sales", body, auth);
      } else {
        await axios.put(`http://localhost:3000/sales/${cur.id}`, body, auth);
      }
      await refreshData();
      setOpenForm(false);
      reset();
    } catch (e) {
      console.error("[Save Sale ERROR]", e);
    }
  }

  async function handleDelete() {
    try {
      await axios.delete(`http://localhost:3000/sales/${cur.id}`, auth);
      await refreshData();
      setOpenDel(false);
      reset();
    } catch (e) {
      console.error("[Delete Sale ERROR]", e);
    }
  }

  async function refreshData() {
    try {
      const [prodRes, saleRes] = await Promise.all([
        axios.get("http://localhost:3000/products", { params: { storeId }, ...auth }),
        axios.get("http://localhost:3000/sales", { params: { storeId }, ...auth }),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setRows(Array.isArray(saleRes.data) ? saleRes.data : []);
    } catch (e) {
      console.error("[Refresh ERROR]", e);
    }
  }

  const getProduct = (id) => products.find((p) => p.id === id);

  const flatRows = rows.map((row) => {
    const product = row.product || {};
    return {
      ...row,
      productName: product.name ?? "-",
      unitPrice: typeof product.price === "number" ? product.price : null,
      stock: product.stock ?? "-",
      total:
        typeof product.price === "number" && typeof row.quantity === "number"
          ? product.price * row.quantity
          : null,
    };
  });

  // Колонки таблиці
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "productName", headerName: "Товар", flex: 1 },
    { field: "unitPrice", headerName: "Ціна за од.", width: 120 },
    { field: "quantity", headerName: "К-сть", width: 90 },
    { field: "stock", headerName: "Залишок", width: 100 },
    { field: "total", headerName: "Сума", width: 120 },
    {
      field: "actions",
      headerName: "",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const row = params?.row;
        if (!row) return null;
        return (
          <>
            <IconButton size="small" onClick={() => { setCur(row); setOpenForm(true); }}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => { setCur(row); setOpenDel(true); }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </>
        );
      },
    },
  ];

  // Загальна сума по таблиці
  const grandTotal = flatRows.reduce(
    (sum, r) =>
      typeof r.unitPrice === "number" && typeof r.quantity === "number"
        ? sum + r.unitPrice * r.quantity
        : sum,
    0
  );

  return (
    <Card sx={{ height: 420, display: "flex", flexDirection: "column", boxShadow: 3 }}>
      <CardHeader
        title="Продажі"
        action={
          <IconButton
            sx={{ color: "#fff" }}
            disabled={!storeId}
            onClick={() => { reset(); setOpenForm(true); }}
          >
            <AddIcon />
          </IconButton>
        }
        sx={{ bgcolor: "warning.main", color: "#fff" }}
      />
      <Divider />

      {/* Таблиця продажів */}
      <Box sx={{ flexGrow: 1 }}>
        <DataGrid
          rows={flatRows}
          columns={columns}
          density="compact"
          disableRowSelectionOnClick
          getRowId={(r) => r?.id}
        />
      </Box>

      {/* Сумарна вартість */}
      <Box sx={{ p: 1, textAlign: "right", fontWeight: "bold" }}>
        Разом: ₴ {grandTotal.toFixed(2)}
      </Box>

      {/* Діалог створення/редагування */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>{cur.id ? "Редагувати продаж" : "Додати продаж"}</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
            overflow: "visible"
          }}
        >
          <TextField
            select
            label="Товар"
            value={cur.productId}
            onChange={(e) => {
              const pid = +e.target.value;
              const price = getProduct(pid)?.price ?? 0;
              setCur((c) => ({ ...c, productId: pid, total: price * (c.quantity || 0) }));
            }}
          >
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} (₴{p.price})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            label="Кількість"
            value={cur.quantity}
            onChange={(e) => {
              const qty = +e.target.value;
              const price = getProduct(+cur.productId)?.price ?? 0;
              setCur((c) => ({ ...c, quantity: qty, total: price * qty }));
            }}
          />
          <TextField
            label="Сума"
            value={cur.total.toFixed(2)}
            InputProps={{ readOnly: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Скасувати</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!+cur.productId || !+cur.quantity}
          >
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      {/* Діалог підтвердження видалення */}
      <Dialog open={openDel} onClose={() => setOpenDel(false)}>
        <DialogTitle>Видалити запис про продаж?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenDel(false)}>Ні</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Так</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
