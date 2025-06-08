import React from 'react';
import logo from './logo.svg';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {ThemeProvider} from "./Context/ThemeContext";
import {UtilitiesProvider} from "./Context/UtilitiesContext";
import {LoginProvider} from "./Context/LoginContext";
import {DataProvider} from "./Context/DataContext";
import {NotificationProvider} from "./Context/NotificationContext";
import Layout from "./Dashboard/Layout";
import LoginPage from "./GeneralPages/LoginPage";
import SignupPage from "./GeneralPages/SignupPage";
import ProfilePage from "./Dashboard/Pages/ProfilePage";
import QRCodePage from "./Dashboard/Pages/QRCodePage";
import HomePage from "./Dashboard/Pages/HomePage";
import MenuPage from "./Dashboard/Pages/MenuPage";
import ProductPage from "./Dashboard/Pages/ProductPage";
import IngredientsPage from "./Dashboard/Pages/IngredientsPage";
import TablesPage from "./Dashboard/Pages/TablesPage";
import TablesPageTest from "./Dashboard/Pages/TablesPageTest";
import OrderPage from "./Dashboard/Pages/OrderPage";
import WaitersPage from "./Dashboard/Pages/WaitersPage";
import CategoryPage from "./Dashboard/Pages/CategoryPage";
import IngredientPage from "./Dashboard/Pages/IngredientPage";
import CategoriesPage from "./Dashboard/Pages/CategoriesPage";
import ClientCategoriesPage from "./Client/Pages/ClientCategoriesPage";
import ClientProductsPage from "./Client/Pages/ProductsPage";
import ClientProductPage from "./Client/Pages/ClientProductPage";
import {HistoryProvider} from "./Context/HistoryContext";
import CartPage from "./Client/Pages/CartPage";

const WaiterRoutes = () => (
  <LoginProvider>
    <DataProvider dashboard={false} waiters={true}>
      <NotificationProvider>
        <Routes>
          <Route path={"/Categories"} element={<ClientCategoriesPage/>}/>
          <Route path={"/Products/:idCategory"} element={<ClientProductsPage/>}/>
          <Route path={"/cart"} element={<CartPage waiter={true}/>}/>
        </Routes>
      </NotificationProvider>
    </DataProvider>
  </LoginProvider>
)

const ClientRoutes = () => (
    <DataProvider dashboard={false}>
      <NotificationProvider>
        <Routes>
          <Route path={"Categories"} element={<ClientCategoriesPage/>}/>
          <Route path={"Products/:idCategory"} element={<ClientProductsPage/>}/>
          <Route path={"Product/:idProduct"} element={<ClientProductPage/>}/>
          <Route path={"Allergens"} element={<ClientCategoriesPage/>}/>
          <Route path={"/cart"} element={<CartPage waiter={false}/>}/>
        </Routes>
      </NotificationProvider>
    </DataProvider>
)

const DashboardRoutes = () => (
    <LoginProvider>
      <HistoryProvider>
        <DataProvider dashboard={true}>
          <NotificationProvider>
            <Routes>
              <Route path={"/"} element={<Layout/>}>
                <Route path={"QRCode"} element={<QRCodePage />}/>
                <Route path={"Profile"} element={<ProfilePage />}/>
                <Route path={"Home"} element={<HomePage />}/>
                <Route path={"Menu"} element={<MenuPage />}/>
                <Route path={"AddProduct"} element={<ProductPage isNew={true} />}/>
                <Route path={"AddCategory"} element={<CategoryPage isNew={true} />}/>
                <Route path={"AddIngredient"} element={<IngredientPage isNew={true}/>}/>
                <Route path={"Product/:idProduct"} element={<ProductPage isNew={false} />}/>
                <Route path={"Category/:idCategory"} element={<CategoryPage isNew={false} />}/>
                <Route path={"Ingredient/:idIngredient"} element={<IngredientPage isNew={false}/>}/>
                <Route path={"Ingredients"} element={<IngredientsPage/>}/>
                <Route path={"Categories"} element={<CategoriesPage/>}/>
                <Route path={"Waiters"} element={<WaitersPage/>}/>
                <Route path={"Layout"}/>
                {/*<Route path={"Tables"} element={<TablesPage/>}/>*/}
                <Route path={"Tables"} element={<TablesPageTest/>}/>
                <Route path={"Orders"} element={<OrderPage/>}/>
                <Route path={"AddTable"}/>
              </Route>
            </Routes>
          </NotificationProvider>
        </DataProvider>
      </HistoryProvider>
    </LoginProvider>
)

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <UtilitiesProvider>
            <Routes>
              <Route path={"/login"} element={<LoginProvider><LoginPage/></LoginProvider>} />
              <Route path={"/signup"} element={<SignupPage/>} />
              {/*<Route path={"/confirmAccount/:id/:code"} element={<Conf/>} />*/}
              <Route path={"/:localname/Dashboard/*"} element={<DashboardRoutes/>} />
              <Route path={"/Waiters/:localname/*"} element={<WaiterRoutes />} />
              <Route path={"/:localname/*"} element={<ClientRoutes/>} />
            </Routes>
          </UtilitiesProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
