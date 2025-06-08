import React, {useState} from "react";

interface ManageItemsModalProps {
    title: string;
    itemsMap: Map<number, { name: string }>;
    selectedItems: number[];
    onChange: (newSelected: number[]) => void;
    onClose: () => void;
}

const ManageItemsModal: React.FC<ManageItemsModalProps> = ({
                                                               title,
                                                               itemsMap,
                                                               selectedItems,
                                                               onChange,
                                                               onClose,
                                                           }) => {
    const [filter, setFilter] = useState("");

    const filteredOptions = () => {
        return Array.from(itemsMap.keys()).filter((id) =>
            itemsMap.get(id)?.name.toLowerCase().includes(filter.toLowerCase())
        );
    };

    const handleAddOrRemove = (id: number) => {
        if(!selectedItems.includes(id) && selectedItems.map(a => Math.abs(a)).includes(id)){
            return
        }
        if (selectedItems.includes(id)) {
            onChange(selectedItems.filter((item) => item !== id));
        } else {
            onChange([...selectedItems, id]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-md p-6 max-h-96 overflow-y-auto" style={{ width: "80vw", maxWidth: "600px" }}>
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <input
                    type="text"
                    placeholder="Filtra..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full mb-4 p-2 border rounded-md"
                />
                <div className="flex flex-wrap">
                    {filteredOptions().map((id) => (
                        <button
                            key={id}
                            onClick={() => handleAddOrRemove(id)}
                            className={
                                "m-1 px-3 py-1 rounded-md border " +
                                (selectedItems.includes(id) ? "bg-blue-500 text-white" : selectedItems.map(a => Math.abs(a)).includes(id) ? "bg-orange-500 text-white" : "bg-gray-200")
                            }
                        >
                            {itemsMap.get(id)?.name}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md">
                    Chiudi
                </button>
            </div>
        </div>
    );
};

export default ManageItemsModal