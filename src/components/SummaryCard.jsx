const SummaryCard = ({ title, value, color }) => {
  return (
  <div className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100">
    <p className="text-sm text-gray-500 uppercase tracking-wide">{title}</p>
    <h2 className={`text-2xl font-semibold mt-1 ${color}`}>
      ₹ {value}
    </h2>
  </div>
);
};

export default SummaryCard;