import { useState } from "react";
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

export default function EmployeeCard({ rows, setRows, auth, storeId }) {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [cur, setCur] = useState({ id: null, name: "", role: "", storeId: "" });

  const query = { params: { storeId }, ...auth };
  const refetch = async () => {
    const { data } = await axios.get("http://localhost:3000/employees", query);
    setRows(data);
  };

  const reset = () => setCur({ id: null, name: "", role: "", storeId: "" });

  const handleSave = async () => {
    const body = {
      name: cur.name,
      role: cur.role,
      storeId: Number(cur.storeId)
    };
    if (cur.id === null) {
      await axios.post("http://localhost:3000/employees", body, auth);
    } else {
      await axios.put(`http://localhost:3000/employees/${cur.id}`, body, auth);
    }
    await refetch();
    setOpenForm(false);
    reset();
  };

  const handleDelete = async () => {
    await axios.delete(`http://localhost:3000/employees/${cur.id}`, auth);
    await refetch();
    setOpenDel(false);
    reset();
  };

  // Колонки для DataGrid
  const columns = [
    { field: "id",       headerName: "ID",        width: 70 },
    { field: "name",     headerName: "Імʼя",      flex: 1 },
    { field: "role",     headerName: "Роль",      width: 120 },
    { field: "storeId",  headerName: "ID магаз.", width: 110 },
    {
      field: "actions",
      headerName: "",
      width: 110,
      renderCell: ({ row }) => (
        <>
          <IconButton size="small" onClick={() => { setCur(row); setOpenForm(true); }}>
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
    <Card sx={{
      height: 420,
      display: "flex",
      flexDirection: "column",
      boxShadow: 3
    }}>
      <CardHeader
        title="Працівники"
        action={
          <IconButton
            onClick={() => { reset(); setOpenForm(true); }}
            sx={{ color: "#fff" }}>
            <AddIcon />
          </IconButton>
        }
        sx={{ bgcolor: "#9c27b0", color: "#fff" }}
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
        <DialogTitle>{cur.id ? "Редагувати працівника" : "Додати працівника"}</DialogTitle>
        <DialogContent sx={{
          display: "flex", flexDirection: "column", gap: 2, mt: 1, overflow: "visible"
        }}>
          <TextField
            label="Імʼя"
            value={cur.name}
            onChange={e => setCur({ ...cur, name: e.target.value })}
          />
          <TextField
            label="Роль (admin / cashier / ...)"
            value={cur.role}
            onChange={e => setCur({ ...cur, role: e.target.value })}
          />
          <TextField
            label="ID магазину"
            type="number"
            value={cur.storeId}
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
        <DialogTitle>Видалити працівника?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenDel(false)}>Ні</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Так</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
