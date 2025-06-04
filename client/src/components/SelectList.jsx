import { useState, useRef, useEffect } from "react";
import { BsChevronExpand } from "react-icons/bs";

const SelectList = ({ lists, selected, setSelected, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  // Toggle selection
  const toggleItem = (item) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && <p className="text-slate-900 dark:text-gray-500 mb-1">{label}</p>}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full cursor-pointer rounded bg-white pl-3 pr-10 text-left px-3 py-2.5 border border-gray-300 sm:text-sm flex justify-between items-center"
      >
        <span className="truncate">
          {selected.length > 0 ? `${selected.length} selected` : "Select options"}
        </span>
        <BsChevronExpand className="h-5 w-5 text-gray-400" />
      </div>

      {isOpen && (
        <div className="z-50 absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 sm:text-sm">
          {lists.map((list, index) => {
            const isChecked = selected.includes(list);
            return (
              <div
                key={index}
                onClick={() => toggleItem(list)}
                className="cursor-pointer px-4 py-2 hover:bg-amber-100 flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="form-checkbox h-4 w-4 text-amber-600"
                />
                <span className="truncate">{list}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelectList;
