export default function Avatar ({userId, username, online}) {
    const colors = ['bg-red-200', 'bg-green-200', 
                    'bg-lime-200','bg-blue-200', 
                    'bg-fuchsia-200', 'bg-purple-200'];
    const userIdBase10 = parseInt(userId, 16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];
    
    return (
        <div className={"w-12 h-12 relative rounded-full flex items-center " +color}>
           <div className="text-center w-full opacity-70">{username[0]}</div>
           {online && (
            <div className="absolute w-4 h-4 bg-green-400 bottom-0 right-0 rounded-full border border-white">
            </div>
           )}
           {!online && (
            <div className="absolute w-4 h-4 bg-gray-400 bottom-0 right-0 rounded-full border border-white">
            </div>
           )}
        </div>
    );
}