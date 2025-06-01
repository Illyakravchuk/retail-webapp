import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card, CardHeader, Divider, Box, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon    from "@mui/icons-material/Add";
import EditIcon   from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function ProductCard({
  rows, setRows,
  auth,       
  storeId,    
  userRole,   
  userStore   
}) {

  const canEditRow = (sid) =>
    userRole === "admin" ||
    (userRole === "cashier" && +sid === +userStore);

  const canAdd = userRole === "admin" ||
                 (userRole === "cashier" && +storeId === +userStore);

  // Шаблон товару
  const blank = {
    id: null,
    name: "",
    price: "",
    stock: "",
    storeId: userRole === "cashier" ? userStore : (storeId || 1)
  };

  const [cur, setCur] = useState(blank);
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);

  useEffect(() => { refetch(); }, [storeId]);
  async function refetch() {
    const q = storeId ? { params: { storeId }, ...auth } : auth;
    const { data } = await axios.get("http://localhost:3000/products", q);
    setRows(data);
  }

  const reset = () => setCur(blank);

  async function handleSave() {
    const body = {
      name: cur.name,
      price: +cur.price,
      stock: +cur.stock,
      storeId: +cur.storeId
    };
    if (cur.id === null)
      await axios.post("http://localhost:3000/products", body, auth);
    else
      await axios.put(`http://localhost:3000/products/${cur.id}`, body, auth);

    await refetch();
    setOpenForm(false);
    reset();
  }

  async function handleDelete() {
    await axios.delete(`http://localhost:3000/products/${cur.id}`, auth);
    await refetch();
    setOpenDel(false);
    reset();
  }

  // Колонки DataGrid
  const columns = [
    { field: "id",      headerName: "ID",          width: 70 },
    { field: "name",    headerName: "Назва",       flex: 1 },
    { field: "price",   headerName: "Ціна",        width: 90 },
    { field: "stock",   headerName: "К-сть",       width: 90 },
    { field: "storeId", headerName: "ID магазину", width: 120 },
    {
      field: "actions",
      headerName: "",
      width: 110,
      renderCell: ({ row }) => canEditRow(row.storeId) && (
        <>
          <IconButton size="small"
            onClick={() => { setCur(row); setOpenForm(true); }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error"
            onClick={() => { setCur(row); setOpenDel(true); }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      )
    }
  ];

  // UI
  return (
    <Card sx={{ height: 420, display: "flex", flexDirection: "column", boxShadow: 3 }}>
      <CardHeader
        title="Товари"
        action={canAdd && (
          <IconButton sx={{ color: "#fff" }}
            onClick={() => { reset(); setOpenForm(true); }}>
            <AddIcon />
          </IconButton>
        )}
        sx={{ bgcolor: "success.main", color: "#fff" }}
      />
      <Divider />
      <Box sx={{ flexGrow: 1 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          density="compact"
          disableRowSelectionOnClick
        />
      </Box>

      {/* Форма додавання/редагування */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>{cur.id ? "Редагувати товар" : "Додати товар"}</DialogTitle>
        <DialogContent sx={{
          display: "flex", flexDirection: "column", gap: 2, mt: 1, overflow: "visible"
        }}>
          <TextField
            label="Назва"
            value={cur.name}
            onChange={e => setCur({ ...cur, name: e.target.value })}
          />
          <TextField
            label="Ціна"
            type="number"
            value={cur.price}
            onChange={e => setCur({ ...cur, price: e.target.value })}
          />
          <TextField
            label="Кількість"
            type="number"
            value={cur.stock}
            onChange={e => setCur({ ...cur, stock: e.target.value })}
          />
          <TextField
            label="ID магазину"
            type="number"
            value={cur.storeId}
            disabled={userRole === "cashier"}
            onChange={e => setCur({ ...cur, storeId: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Скасувати</Button>
          <Button variant="contained" onClick={handleSave}>Зберегти</Button>
        </DialogActions>
      </Dialog>

      {/* Діалог видалення */}
      <Dialog open={openDel} onClose={() => setOpenDel(false)}>
        <DialogTitle>Видалити товар?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenDel(false)}>Ні</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Так</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
