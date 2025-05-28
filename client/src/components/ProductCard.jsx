import { useState } from "react";
import axios from "axios";
import {
  Card, CardHeader, IconButton, Divider,
  Box, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function ProductCard({ rows, setRows, auth }) {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [cur, setCur] = useState({
    id: null, name: "", price: "", stock: "", storeId: 1
  });

  const refetch = async () => {
    const { data } = await axios.get("http://localhost:3000/products", auth);
    setRows(data);
  };

  const reset = () => setCur({ id: null, name: "", price: "", stock: "", storeId: 1 });

  const handleSave = async () => {
    const payload = {
      name: cur.name,
      price: Number(cur.price),
      stock: Number(cur.stock),
      storeId: Number(cur.storeId)
    };

    try {
      if (cur.id === null) {
        await axios.post("http://localhost:3000/products", payload, auth);
      } else {
        await axios.put(`http://localhost:3000/products/${cur.id}`, payload, auth);
      }
      await refetch();
      setOpenForm(false);
      reset();
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3000/products/${cur.id}`, auth);
      await refetch();
      setOpenDel(false);
      reset();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Назва", flex: 1 },
    { field: "price", headerName: "Ціна", width: 100 },
    { field: "stock", headerName: "К-сть", width: 90 },
    { field: "storeId", headerName: "ID магазину", width: 120 },
    {
      field: "actions",
      headerName: "",
      width: 110,
      renderCell: ({ row }) => (
        <>
          <IconButton size="small" onClick={() => { setCur(row); setOpenForm(true); }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => { setCur(row); setOpenDel(true); }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      )
    }
  ];

  return (
    <Card sx={{
      height: 420,
      display: "flex",
      flexDirection: "column",
      boxShadow: 3
    }}>
      <CardHeader
        title="Товари"
        action={
          <IconButton onClick={() => { reset(); setOpenForm(true); }} sx={{ color: "#fff" }}>
            <AddIcon />
          </IconButton>
        }
        sx={{ bgcolor: "success.main", color: "#fff" }}
      />
      <Divider />
      <Box sx={{ flexGrow: 1 }}>
        <DataGrid rows={rows} columns={columns} density="compact" disableRowSelectionOnClick />
      </Box>

      <Dialog open={openForm} onClose={() => setOpenForm(false)}>
        <DialogTitle>{cur.id ? "Редагувати товар" : "Додати товар"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Назва" value={cur.name}
            onChange={e => setCur({ ...cur, name: e.target.value })} />
          <TextField label="Ціна" type="number" value={cur.price}
            onChange={e => setCur({ ...cur, price: e.target.value })} />
          <TextField label="Кількість" type="number" value={cur.stock}
            onChange={e => setCur({ ...cur, stock: e.target.value })} />
          <TextField label="ID магазину" type="number" value={cur.storeId}
            onChange={e => setCur({ ...cur, storeId: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Скасувати</Button>
          <Button variant="contained" onClick={handleSave}>Зберегти</Button>
        </DialogActions>
      </Dialog>

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