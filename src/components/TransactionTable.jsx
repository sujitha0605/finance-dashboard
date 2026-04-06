const TransactionTable = ({ transactions }) => {
    if (transactions.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm mt-6 text-center">
        No transactions found
      </div>
    );
  }
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">

      <h2 className="text-xl font-semibold mb-4">Transactions</h2>

      {transactions.length === 0 ? (
        <p>No transactions available</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Type</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-2">{t.date}</td>
                <td>{t.category}</td>
                <td>₹ {t.amount}</td>
                <td
                  className={
                    t.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {t.type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
};

export default TransactionTable;