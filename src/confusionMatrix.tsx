


export function ConfusionMatrixTable({ confusionMatrix }: { confusionMatrix: number[][] | null }) {

    if (confusionMatrix === null || !confusionMatrix.length) {
        return <div></div>;
    }

    let rows = confusionMatrix.map((row, i) => {
        let cells = row.map((cell, j) => {
            return <td key={j} className={`border border-gray-400 text-center ${i == j ? "bg-green-300" : ""}`}>{cell}</td>;
        });
        let sum = row.reduce((acc, val) => acc + val, 0);
        return <tr key={i}>
            <th className="border border-gray-400 bg-gray-200 text-center">{`A${i + 1}`}</th>
            {cells}
            <td className="border border-gray-400 text-center">{sum}</td>
        </tr>;
    });

    return (
        <table className="table-fixed w-auto">
            <thead>
                <tr>
                    <th></th>
                    {confusionMatrix.length && confusionMatrix[0].map((_, i) => <th key={i} className="border border-gray-400 bg-gray-200 text-center">{`P${i + 1}`}</th>)}
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {rows}
                {confusionMatrix.length && (<tr>
                    <th></th>
                    {confusionMatrix[0].map((_, i) => {
                        let sum = confusionMatrix.reduce((acc, row) => acc + row[i], 0);
                        return <td key={i} className="border border-gray-400 text-center">{sum}</td>;
                    })}
                </tr>
                )}
            </tbody>
        </table>
    );
}