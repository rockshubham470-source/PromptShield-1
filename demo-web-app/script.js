document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('clickMe');
    const content = document.getElementById('content');
    
    button.addEventListener('click', function() {
        content.innerHTML = `
            <h2>Button Clicked!</h2>
            <p>Thanks for interacting with the demo app.</p>
            <p>Current time: ${new Date().toLocaleTimeString()}</p>
            <button id="resetBtn">Reset</button>
        `;
        
        // Add event listener to the new reset button
        document.getElementById('resetBtn').addEventListener('click', function() {
            content.innerHTML = `
                <p>This is a demo web app to showcase Claude Code tool functionality.</p>
                <button id="clickMe">Click me!</button>
            `;
            // Re-attach event listener to the button
            document.getElementById('clickMe').addEventListener('click', arguments.callee);
        });
    });
});
