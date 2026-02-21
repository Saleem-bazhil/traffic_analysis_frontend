export default function Footer() {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto transition-colors duration-200">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                &copy; {currentYear} Traffic Density Analyzer. Powered by YOLOv8 and Django.
            </div>
        </footer>
    );
}
