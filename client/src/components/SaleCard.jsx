import { useState } from "react";
import axios from "axios";
import {
  Card, CardHeader, IconButton, Divider,
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function SalesCard({ rows, setRows, auth }) {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [cur, setCur] = useState({
    id: null, productId: "", storeId: "", quantity: "", total: ""
  });

  const refetch = async () => {
    const { data } = await axios.get("http://localhost:3000/sales", auth);
    setRows(data);
  };
  const reset = () => setCur({ id: null, productId: "", storeId: "", quantity: "", total: "" });

  const handleSave = async () => {
    const payload = {
      productId: Number(cur.productId),
      storeId: Number(cur.storeId),
      quantity: Number(cur.quantity),
      total: Number(cur.total)
    };

    try {
      if (cur.id === null) {
        await axios.post("http://localhost:3000/sales", payload, auth);
      } else {
        await axios.put(`http://localhost:3000/sales/${cur.id}`, payload, auth);
      }
      await refetch();
      setOpenForm(false);
      reset();
    } catch (err) {
      console.error("Помилка при збереженні продажу:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3000/sales/${cur.id}`, auth);
      await refetch();
      setOpenDel(false);
      reset();
    } catch (err) {
      console.error("Помилка при видаленні продажу:", err);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "productId", headerName: "ID товару", width: 110 },
    { field: "storeId", headerName: "ID магазину", width: 120 },
    { field: "quantity", headerName: "Кількість", width: 100 },
    { field: "total", headerName: "Сума", width: 100 },
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
        title="Продажі"
        action={
          <IconButton onClick={() => { reset(); setOpenForm(true); }} sx={{ color: "#fff" }}>
            <AddIcon />
          </IconButton>
        }
        sx={{ bgcolor: "warning.main", color: "#fff" }}
      />
      <Divider />
      <Box sx={{ flexGrow: 1 }}>
        <DataGrid rows={rows} columns={columns} density="compact" disableRowSelectionOnClick />
      </Box>

      <Dialog open={openForm} onClose={() => setOpenForm(false)}>
        <DialogTitle>{cur.id ? "Редагувати продаж" : "Додати продаж"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="ID товару" type="number" value={cur.productId}
            onChange={e => setCur({ ...cur, productId: e.target.value })} />
          <TextField label="ID магазину" type="number" value={cur.storeId}
            onChange={e => setCur({ ...cur, storeId: e.target.value })} />
          <TextField label="Кількість" type="number" value={cur.quantity}
            onChange={e => setCur({ ...cur, quantity: e.target.value })} />
          <TextField label="Сума" type="number" value={cur.total}
            onChange={e => setCur({ ...cur, total: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Скасувати</Button>
          <Button variant="contained" onClick={handleSave}>Зберегти</Button>
        </DialogActions>
      </Dialog>

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