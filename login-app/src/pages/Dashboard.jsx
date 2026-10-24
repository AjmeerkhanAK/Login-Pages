
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Avatar,
  Stack,
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/auth/authSlice";
import { useNavigate, Link as RouterLink } from "react-router-dom";

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return (
      <Container sx={{ mt: 6 }}>
        <Typography>Please log in to view your dashboard.</Typography>
        <Button component={RouterLink} to="/login">
          Go to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            Welcome back, {user.name}!
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={handleLogout}
          disabled={loading}
        >
          Logout
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        <Card elevation={2}>
          <CardContent>
            <Typography color="text.secondary">
              Account
            </Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Active
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent>
            <Typography color="text.secondary">
              Email
            </Typography>
            <Typography variant="h6" sx={{ mt: 1, overflowWrap: "anywhere" }}>
              {user.email}
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent>
            <Typography color="text.secondary">
              Profile
            </Typography>
            <Button
              component={RouterLink}
              to="/profile"
              sx={{ mt: 1 }}
            >
              View Profile
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mt: 4 }} elevation={2}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 56, height: 56 }}>
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{user.name}</Typography>
              <Typography color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
