"use client";
import { Stack, TextField, Typography, Button, Input } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { es } from "date-fns/locale";
import { formatRelative, subDays } from "date-fns";

const socket = io("http://localhost:9001");

export default function Home() {
  const [message, setMessage] = useState("");

  // no se actualizará el estado por lo cual se elimina setId
  const [id] = useState(uuidv4());
  const [listMessage, setListMessage] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [image, setImage] = useState(null);

  async function handleClick(e) {
    e.preventDefault();

    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Solo se permiten imágenes.");
        setFile(null);
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await res.json();
      setImage(data.url);

      socket.emit("newMessage", {
        id,
        message: message || "",
        fechamessage: formatRelative(subDays(new Date(), 0), new Date(), {
          locale: es,
        }),
        archivo: data.url,
      });
    } else {
      const fecha = formatRelative(subDays(new Date(), 0), new Date(), {
        locale: es,
      });

      socket.emit("newMessage", {
        id,
        message: message || "",
        fechamessage: fecha,
        archivo: null,
      });
    }

    setMessage("");
    setFile(null);
    setError(null);
  }

  function getFile(e) {
    const data = e.target.files[0];
    setFile(data);
    setError(null);
  }

  useEffect(() => {
    socket.on("messages", (data) => {
      setListMessage((prevListMessages) => prevListMessages.concat(data));
      setImage(data.url);
      console.log("desde useEffect", data.url);
    });
  }, []);

  return (
    <Stack
      sx={{
        height: "100%",
      }}
    >
      <Stack
        sx={{
          backgroundColor: "#FFF",
          height: "60px",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
          borderRadius: 5,
        }}
        direction="row"
      >
        <Typography
          sx={{
            color: "#54555B",
            fontSize: "25px",
            fontWeight: "bolder",
          }}
        >
          Chat Online
        </Typography>
      </Stack>

      <Stack
        sx={{
          backgroundColor: "#ADD8E6",
          flexGrow: 1,
          paddingBlock: "10px",
        }}
        spacing={2}
      >
        {listMessage.map((item, index) => (
          <Stack
            key={index}
            sx={{
              maxWidth: "60%",
              minHeight: "30px",
              backgroundColor: item.message ? "white" : "transparent",
              borderRadius: "15px",
              alignSelf: item.id === id ? "end" : "start",
              p: 1,
            }}
          >
            {item.message && <Typography>{item.message}</Typography>}
            {item.archivo && (
              <img
                src={item.archivo}
                alt="Uploaded"
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  marginTop: "10px",
                }}
              />
            )}
            <Typography
              sx={{
                alignSelf: "end",
                color: item.message ? "gray" : "black",
                fontSize: 9,
              }}
            >
              {item.fechamessage}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack
        sx={{
          height: "60px",
          alignItems: "center",
        }}
        direction="row"
        spacing={2}
      >
        <TextField
          variant="standard"
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Input type="file" onChange={getFile} />
        <Button
          onClick={handleClick}
          variant="contained"
          disabled={message.trim() === "" && !file}
          endIcon={<SendIcon />}
        />
      </Stack>

      {error && (
        <Typography
          sx={{
            color: "red",
            textAlign: "center",
            mt: 2,
          }}
        >
          {error}
        </Typography>
      )}
    </Stack>
  );
}
