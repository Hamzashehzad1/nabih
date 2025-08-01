(function() {
    const scriptTag = document.getElementById('content-forge-feedback-tool');
    const projectId = scriptTag.getAttribute('data-project-id');

    if (!projectId) {
        console.error('Content Forge Feedback: Project ID not found.');
        return;
    }

    let isFeedbackMode = false;
    let feedbackButton;
    let commentBox;

    function createFeedbackButton() {
        const button = document.createElement('button');
        button.id = 'cf-feedback-btn';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3v4l4-4Z"></path><path d="m15.5 8-4 4"></path><path d="m11.5 8 4 4"></path></svg>
        `;
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.width = '60px';
        button.style.height = '60px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = '#A674F8'; // Use a default color
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        button.style.cursor = 'pointer';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.zIndex = '999999999';
        button.addEventListener('click', toggleFeedbackMode);
        document.body.appendChild(button);
        return button;
    }

    function createCommentBox() {
        const box = document.createElement('div');
        box.id = 'cf-comment-box';
        box.style.position = 'absolute';
        box.style.display = 'none';
        box.style.width = '300px';
        box.style.backgroundColor = 'white';
        box.style.border = '1px solid #ddd';
        box.style.borderRadius = '8px';
        box.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        box.style.padding = '15px';
        box.style.zIndex = '1000000000';
        box.innerHTML = `
            <textarea id="cf-comment-textarea" placeholder="Leave your feedback here..." style="width: 100%; height: 80px; border: 1px solid #ccc; border-radius: 4px; padding: 8px; font-family: inherit; font-size: 14px; margin-bottom: 10px;"></textarea>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button id="cf-cancel-comment" style="padding: 8px 12px; border: 1px solid #ccc; background: #f0f0f0; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="cf-submit-comment" style="padding: 8px 12px; border: none; background: #A674F8; color: white; border-radius: 4px; cursor: pointer;">Submit</button>
            </div>
        `;
        document.body.appendChild(box);
        return box;
    }

    function toggleFeedbackMode() {
        isFeedbackMode = !isFeedbackMode;
        if (isFeedbackMode) {
            document.body.style.cursor = 'crosshair';
            feedbackButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
            document.addEventListener('click', handlePageClick, true);
        } else {
            document.body.style.cursor = 'default';
            feedbackButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3v4l4-4Z"></path><path d="m15.5 8-4 4"></path><path d="m11.5 8 4 4"></path></svg>`;
            document.removeEventListener('click', handlePageClick, true);
            hideCommentBox();
        }
    }

    function handlePageClick(e) {
        if (!isFeedbackMode) return;
        
        // Prevent click if it's on the feedback UI itself
        if (e.target.id.startsWith('cf-') || e.target.closest('#cf-comment-box')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const path = getCssPath(e.target);
        showCommentBox(e.pageX, e.pageY, path);
    }
    
    function showCommentBox(x, y, path) {
        commentBox.style.left = `${x}px`;
        commentBox.style.top = `${y}px`;
        commentBox.style.display = 'block';

        document.getElementById('cf-cancel-comment').onclick = hideCommentBox;
        document.getElementById('cf-submit-comment').onclick = () => submitComment(path);
    }

    function hideCommentBox() {
        if (commentBox) {
            commentBox.style.display = 'none';
            document.getElementById('cf-comment-textarea').value = '';
        }
    }

    function submitComment(path) {
        const commentText = document.getElementById('cf-comment-textarea').value;
        if (!commentText.trim()) {
            alert('Please enter a comment.');
            return;
        }

        const payload = {
            projectId: projectId,
            comment: commentText,
            url: window.location.href,
            path: path,
        };
        
        // This is where you would send the data to your server.
        // For this demo, we'll post it to the parent window, where the dashboard is listening.
        window.opener.postMessage({ type: 'new-feedback-comment', payload }, '*');
        
        alert('Feedback submitted!');
        hideCommentBox();
        toggleFeedbackMode();
    }
    
     function getCssPath(el) {
        if (!(el instanceof Element)) return;
        var path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            var selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break;
            } else {
                var sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() == selector)
                        nth++;
                }
                if (nth != 1)
                    selector += ":nth-of-type("+nth+")";
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
    }


    function init() {
        feedbackButton = createFeedbackButton();
        commentBox = createCommentBox();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
