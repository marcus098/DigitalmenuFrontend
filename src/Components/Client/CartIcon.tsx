import { ShoppingCartIcon } from '@heroicons/react/24/solid';
import {useNavigate, useParams} from "react-router-dom";

const CartIcon = () => {
    const {localname} = useParams()
    const navigate = useNavigate()

    return (
        <div className="fixed top-4 right-4 z-50" onClick={() => navigate((window.location.href.toLowerCase().includes("/waiters/") ? "/waiters/" : "/") + localname + "/cart")}>
            <ShoppingCartIcon className="h-8 w-8 text-gray-700 md:h-10 md:w-10 hover:text-gray-900 cursor-pointer" />
        </div>
    );
};

export default CartIcon;
