import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { firebaseApp } from "../../firebase.config";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { format } from "date-fns";
import BottomBarLayout from "../../components/BottomBarLayout";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

const db = getFirestore(firebaseApp);

const OrderHistory = () => {
  const { authState } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Estados para filtros
  const [filterStatus, setFilterStatus] = useState(""); // "" = todos
  const [filterDate, setFilterDate] = useState(null); // null = todas las fechas
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchOrders = () => {
    if (!authState.user) return;
    const q = query(
      collection(db, "pedidos"),
      where("usuario.uid", "==", authState.user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(fetchedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  useEffect(() => {
    fetchOrders();
  }, [authState.user]);

  const getStatusStyle = (estado) => ({
    backgroundColor:
      estado === "Entregado"
        ? "#28a745"
        : estado === "Pendiente"
        ? "#ffc107"
        : estado === "Enviado"
        ? "#009688"
        : "#6c757d",
  });
  const getStatusIcon = (estado) => {
    switch (estado) {
      case "Entregado":
        return "check-circle";
      case "Pendiente":
        return "clock-time-four";
      case "Enviado":
        return "truck-delivery-outline";
      default:
        return "information-outline";
    }
  };

  // Filtrado de pedidos por estado y fecha
  const filteredOrders = orders.filter((order) => {
    let statusMatch = true;
    let dateMatch = true;

    if (filterStatus) {
      statusMatch =
        (order.estado || "").toLowerCase() === filterStatus.toLowerCase();
    }
    if (filterDate) {
      // Compara solo la fecha (sin hora)
      const orderDate = new Date(order.fecha);
      const filterDateOnly = new Date(filterDate);
      orderDate.setHours(0, 0, 0, 0);
      filterDateOnly.setHours(0, 0, 0, 0);
      dateMatch = orderDate.getTime() === filterDateOnly.getTime();
    }
    return statusMatch && dateMatch;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <BottomBarLayout>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>¡Haz tu primera compra!</Text>
          <Text style={styles.emptyText}>
            Aquí podrás ver tus compras y hacer seguimiento de tus pedidos.
          </Text>
          <Pressable
            onPress={() => navigation.navigate("ProductsScreen")}
            style={({ pressed }) => [
              styles.shopButton,
              { backgroundColor: pressed ? "#2563EB" : "#4A90E2" },
            ]}
          >
            <Text style={styles.shopButtonText}>Ver productos</Text>
          </Pressable>
        </View>
      </BottomBarLayout>
    );
  }

  return (
    <BottomBarLayout>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Pedidos</Text>
      </View>
      {/* Filtros */}
      <View
        style={{
          flexDirection: "row",
          marginBottom: 10,
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Filtro por estado */}
        <View style={{ flex: 1 }}>
          <Picker
            selectedValue={filterStatus}
            style={{ flex: 1, height: 50, backgroundColor: "#fff" }}
            mode="dropdown"
            dropdownIconColor="#4A90E2"
            dropdownBackgroundColor="#fff"
            dropdownElevation={6}
            dropdownStyle={{ borderRadius: 12 }}
            onValueChange={(value) => setFilterStatus(value)}
          >
            <Picker.Item label="Todos" value="" />
            <Picker.Item label="Pendiente" value="Pendiente" />
            <Picker.Item label="Enviado" value="Enviado" />
            <Picker.Item label="Entregado" value="Entregado" />
          </Picker>
        </View>
        {/* Filtro por fecha */}
        <Pressable
          style={{
            backgroundColor: "#fff",
            padding: 15,
            borderColor: "#ccc",
            shadowColor: "#ccc",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            borderRadius: 30,
            flex: 1,
            alignItems: "center",
          }}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>
            {filterDate
              ? format(new Date(filterDate), "dd/MM/yyyy")
              : "Todas las fechas"}
          </Text>
        </Pressable>
        {filterDate && (
          <Pressable onPress={() => setFilterDate(null)}>
            <Icon name="close-circle" size={22} color="#e74c3c" />
          </Pressable>
        )}
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={filterDate ? new Date(filterDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === "set" && selectedDate) {
              setFilterDate(selectedDate);
            }
          }}
        />
      )}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("OrdersScreen", { order: item })}
          >
            <View style={styles.orderCard}>
              <View style={styles.orderHeaderRow}>
                <Text style={styles.orderDate}>
                  <Icon name="calendar-month" size={20} color={"gray"} />{" "}
                  {format(new Date(item.fecha), "dd/MM/yyyy")}
                </Text>
                <Text style={styles.orderTotal}>
                  <Icon name="cash-multiple" size={20} color={"gray"} /> $
                  {item.total.toLocaleString("es-CL")}
                </Text>
              </View>

              <View style={styles.productsContainer}>
                {item.productos.slice(0, 2).map((prod, idx) => (
                  <View key={idx} style={styles.productRow}>
                    <Image
                      source={{ uri: prod.image }}
                      style={styles.productImage}
                    />
                    <View>
                      <Text style={styles.productItem}>{prod.name}</Text>
                      <Text>Cantidad: {prod.quantity}</Text>
                    </View>
                  </View>
                ))}
                {item.productos.length > 2 && (
                  <Text style={styles.moreItemsText}>
                    + {item.productos.length - 2} productos
                  </Text>
                )}
              </View>

              <View style={styles.footerRow}>
                {item.estado && (
                  <Text style={[styles.badge, getStatusStyle(item.estado)]}>
                    <Icon
                      name={getStatusIcon(item.estado)}
                      size={16}
                      color="#fff"
                    />{" "}
                    {item.estado}
                  </Text>
                )}

                <Pressable
                  onPress={() =>
                    navigation.navigate("OrdersScreen", { order: item })
                  }
                  style={({ pressed }) => [
                    styles.detailButton,
                    { backgroundColor: pressed ? "#2563EB" : "#4A90E2" },
                  ]}
                >
                  <Text style={styles.detailButtonText}>
                    <Icon name="details" size={16} color="#fff" /> Ver detalles
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </BottomBarLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
  },
  listContent: {
    padding: 12,
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 10,
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  orderDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    fontSize: 15,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  productsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#C5C5C5",
    paddingTop: 10,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  productItem: {
    fontSize: 16,
    color: "#444",
    fontWeight: "bold",
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  moreItemsText: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  footerRow: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  detailButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    color: "#777",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
  },
  shopButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default OrderHistory;
