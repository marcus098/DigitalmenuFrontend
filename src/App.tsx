import React, { Suspense, lazy } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { UtilitiesProvider } from "./Context/UtilitiesContext";
import { LoginProvider } from "./Context/LoginContext";
import { DataProvider } from "./Context/DataContext";
import { NotificationProvider } from "./Context/NotificationContext";
import { HistoryProvider } from "./Context/HistoryContext";
import { CookieConsentProvider } from "./Context/CookieConsentContext";
import CookieBanner from "./Components/CookieConsent/CookieBanner";
import NotificationDisplay from "./Components/NotificationDisplay";
import PWAInstallPrompt from "./Components/PWAInstallPrompt";
import Layout from "./Dashboard/Layout";
import MenuThemeProvider from "./Components/Client/MenuThemeProvider";

// Pagine sempre necessarie (piccole, fuori da route lazy)
import LoginPage from "./GeneralPages/LoginPage";
import SignupPage from "./GeneralPages/SignupPage";
import CardStatusPage from "./All/CardStatusPage";
import WaiterSignupPage from "./Dashboard/Pages/WaiterSignupPage";
import ConfirmEmailPage from "./Dashboard/Pages/ConfirmEmailPage";
import WaiterAccountPendingAdminApproval from "./Dashboard/Pages/WaiterAccountPendingAdminApproval";
import EmailNotConfirmedPage from "./Dashboard/Pages/EmailNotConfirmedPage";

// Legal — lazy loaded
const PrivacyPolicyPage = lazy(() => import("./GeneralPages/PrivacyPolicyPage"));
const CookiePolicyPage  = lazy(() => import("./GeneralPages/CookiePolicyPage"));

// Dashboard — lazy loaded
const ProfilePage          = lazy(() => import("./Dashboard/Pages/ProfilePage"));
const QRCodePage           = lazy(() => import("./Dashboard/Pages/QRCodePage"));
const HomePage             = lazy(() => import("./Dashboard/Pages/HomePage"));
const MenuPage             = lazy(() => import("./Dashboard/Pages/MenuPage"));
const ProductPage          = lazy(() => import("./Dashboard/Pages/ProductPage"));
const IngredientsPage      = lazy(() => import("./Dashboard/Pages/IngredientsPage"));
const TablesPageTest       = lazy(() => import("./Dashboard/Pages/TablesPageTest"));
const OrderPage            = lazy(() => import("./Dashboard/Pages/OrderPage"));
const WaitersPage          = lazy(() => import("./Dashboard/Pages/WaitersPage"));
const CategoryPage         = lazy(() => import("./Dashboard/Pages/CategoryPage"));
const IngredientPage       = lazy(() => import("./Dashboard/Pages/IngredientPage"));
const CategoriesPage       = lazy(() => import("./Dashboard/Pages/CategoriesPage"));
const DocumentsPage        = lazy(() => import("./Dashboard/Pages/DocumentsPage"));
const LoyaltyCardsPage     = lazy(() => import("./Dashboard/Pages/LoyaltyCardsPage"));
const LayoutPage           = lazy(() => import("./Dashboard/Pages/LayoutPage"));
const TakeawaySlotsPage    = lazy(() => import("./Dashboard/Pages/TakeawaySlotsPage"));
const ReservationsPage     = lazy(() => import("./Dashboard/Pages/ReservationsPage"));
const CassaPage            = lazy(() => import("./Dashboard/Pages/CassaPage"));
const AnalyticsPage        = lazy(() => import("./Dashboard/Pages/AnalyticsPage"));
const WaiterAnalyticsPage  = lazy(() => import("./Dashboard/Pages/WaiterAnalyticsPage"));

// Client — lazy loaded
const VenueLandingPage     = lazy(() => import("./Client/Pages/VenueLandingPage"));
const ClientCategoriesPage = lazy(() => import("./Client/Pages/ClientCategoriesPage"));
const ClientProductsPage   = lazy(() => import("./Client/Pages/ProductsPage"));
const ClientProductPage    = lazy(() => import("./Client/Pages/ClientProductPage"));
const CartPage             = lazy(() => import("./Client/Pages/CartPage"));
const HistoryOrdersPage    = lazy(() => import("./Client/Pages/HistoryOrdersPage"));
const OrderStatusPage      = lazy(() => import("./Client/Pages/OrderStatusPage"));
const PaymentPage          = lazy(() => import("./Client/Pages/PaymentPage"));
const TableAccessCodePage      = lazy(() => import("./Client/Pages/TableAccessCodePage"));
const TableSessionWaitingPage  = lazy(() => import("./Client/Pages/TableSessionWaitingPage"));
const TableLivePage            = lazy(() => import("./Client/Pages/TableLivePage"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-neutral-50">
    <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

const WaiterRoutes = () => (
  <LoginProvider>
    <DataProvider dashboard={false} waiters={true}>
      <NotificationProvider>
        <MenuThemeProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path={"/Categories"} element={<ClientCategoriesPage />} />
              <Route path={"/Products/:idCategory"} element={<ClientProductsPage />} />
              <Route path={"/cart"} element={<CartPage waiter={true} />} />
            </Routes>
          </Suspense>
          <NotificationDisplay />
        </MenuThemeProvider>
      </NotificationProvider>
    </DataProvider>
  </LoginProvider>
);

const ClientRoutes = () => (
  <DataProvider dashboard={false}>
    <NotificationProvider>
      <MenuThemeProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route index element={<VenueLandingPage />} />
            <Route path={"Categories"} element={<ClientCategoriesPage />} />
            <Route path={"Products/:idCategory"} element={<ClientProductsPage />} />
            <Route path={"Product/:idProduct"} element={<ClientProductPage />} />
            <Route path={"Allergens"} element={<ClientCategoriesPage />} />
            <Route path={"/cart"} element={<CartPage waiter={false} />} />
            <Route path="/history" element={<HistoryOrdersPage />} />
            <Route path="/order-status/:comandId" element={<OrderStatusPage />} />
            <Route path="/payment/:comandId" element={<PaymentPage />} />
            <Route path="/table-access" element={<TableAccessCodePage />} />
            <Route path="/table-session" element={<TableSessionWaitingPage />} />
            <Route path="/table-live" element={<TableLivePage />} />
          </Routes>
        </Suspense>
        <NotificationDisplay />
      </MenuThemeProvider>
    </NotificationProvider>
  </DataProvider>
);

const DashboardRoutes = () => (
  <LoginProvider>
    <HistoryProvider>
      <DataProvider dashboard={true}>
        <NotificationProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path={"/"} element={<Layout />}>
                <Route path={"QRCode"} element={<QRCodePage />} />
                <Route path={"Profile"} element={<ProfilePage />} />
                <Route path={"Home"} element={<HomePage />} />
                <Route path={"Menu"} element={<MenuPage />} />
                <Route path={"AddProduct"} element={<ProductPage isNew={true} />} />
                <Route path={"AddCategory"} element={<CategoryPage isNew={true} />} />
                <Route path={"AddIngredient"} element={<IngredientPage isNew={true} />} />
                <Route path={"Product/:idProduct"} element={<ProductPage isNew={false} />} />
                <Route path={"Category/:idCategory"} element={<CategoryPage isNew={false} />} />
                <Route path={"Ingredient/:idIngredient"} element={<IngredientPage isNew={false} />} />
                <Route path={"Ingredients"} element={<IngredientsPage />} />
                <Route path={"Categories"} element={<CategoriesPage />} />
                <Route path={"Waiters"} element={<WaitersPage />} />
                <Route path={"Documents"} element={<DocumentsPage />} />
                <Route path={"Cards"} element={<LoyaltyCardsPage />} />
                <Route path={"Layout"} element={<LayoutPage />} />
                <Route path={"Slots"} element={<TakeawaySlotsPage />} />
                <Route path={"Tables"} element={<TablesPageTest />} />
                <Route path={"Orders"} element={<OrderPage />} />
                <Route path={"Reservations"} element={<ReservationsPage />} />
                <Route path={"Cassa"} element={<CassaPage />} />
                <Route path={"Analytics"} element={<AnalyticsPage />} />
                <Route path={"WaiterAnalytics"} element={<WaiterAnalyticsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </NotificationProvider>
      </DataProvider>
    </HistoryProvider>
  </LoginProvider>
);

function App() {
  return (
    <BrowserRouter>
      <CookieConsentProvider>
        <NotificationProvider>
          <UtilitiesProvider>
            <Routes>
              <Route path={"/login"} element={<LoginProvider><LoginPage /></LoginProvider>} />
              <Route path={"/cardStatus"} element={<CardStatusPage />} />
              <Route path={"/signup"} element={<SignupPage />} />
              <Route path={"/privacy"} element={<Suspense fallback={<PageLoader />}><PrivacyPolicyPage /></Suspense>} />
              <Route path={"/cookie-policy"} element={<Suspense fallback={<PageLoader />}><CookiePolicyPage /></Suspense>} />
              <Route path={"/:localname/Dashboard/*"} element={<DashboardRoutes />} />
              <Route path={"/Waiters/:localname/*"} element={<WaiterRoutes />} />
              <Route path={"/:localname/*"} element={<ClientRoutes />} />
              <Route path={"/urlInvite/:id/:code"} element={<WaiterSignupPage />} />
              <Route path={"/confirmAccount/:id/:code"} element={<ConfirmEmailPage />} />
              <Route path={"/confirmByAdmin"} element={<WaiterAccountPendingAdminApproval />} />
              <Route path={"/emailNotConfirmed/:id/:code"} element={<EmailNotConfirmedPage />} />
            </Routes>
            <CookieBanner />
            <PWAInstallPrompt />
          </UtilitiesProvider>
        </NotificationProvider>
      </CookieConsentProvider>
    </BrowserRouter>
  );
}

export default App;
