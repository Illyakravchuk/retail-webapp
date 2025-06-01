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

export default function StoreCard({ rows, setRows, auth, userRole }) {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [cur, setCur] = useState({ id: null, name: "", location: "" });

  const refetch = async () => {
    const { data } = await axios.get("http://localhost:3000/stores", auth);
    setRows(data);
  };
  const reset = () => setCur({ id: null, name: "", location: "" });

  const handleSave = async () => {
    const payload = { name: cur.name, location: cur.location };
    if (cur.id === null) {
      await axios.post("http://localhost:3000/stores", payload, auth);
    } else {
      await axios.put(`http://localhost:3000/stores/${cur.id}`, payload, auth);
    }
    await refetch();
    setOpenForm(false);
    reset();
  };

  const handleDelete = async () => {
    await axios.delete(`http://localhost:3000/stores/${cur.id}`, auth);
    await refetch();
    setOpenDel(false);
    reset();
  };

  // Тільки для адміна дії над магазинами
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Назва", flex: 1 },
    { field: "location", headerName: "Адреса", flex: 1 },
    ...(userRole === "admin"
      ? [{
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
      }]
      : [])
  ];

  return (
    <Card sx={{ height: 420, display: "flex", flexDirection: "column", boxShadow: 3 }}>
      <CardHeader
        title="Магазини"
        action={
          userRole === "admin" && (
            <IconButton
              onClick={() => { reset(); setOpenForm(true); }}
              sx={{ color: "#fff" }}
            >
              <AddIcon />
            </IconButton>
          )
        }
        sx={{ bgcolor: "primary.main", color: "#fff" }}
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

      {/* Діалоги (тільки для адміна) */}
      {userRole === "admin" && (
        <>
          <Dialog open={openForm} onClose={() => setOpenForm(false)}>
            <DialogTitle>
              {cur.id ? "Редагувати магазин" : "Додати магазин"}
            </DialogTitle>
            <DialogContent
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mt: 1,
                overflow: "visible",
              }}
            >
              <TextField
                label="Назва"
                value={cur.name}
                onChange={e => setCur({ ...cur, name: e.target.value })}
              />
              <TextField
                label="Адреса"
                value={cur.location}
                onChange={e => setCur({ ...cur, location: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenForm(false)}>Скасувати</Button>
              <Button variant="contained" onClick={handleSave}>Зберегти</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={openDel} onClose={() => setOpenDel(false)}>
            <DialogTitle>Видалити магазин?</DialogTitle>
            <DialogActions>
              <Button onClick={() => setOpenDel(false)}>Ні</Button>
              <Button color="error" variant="contained" onClick={handleDelete}>Так</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Card>
  );
}
