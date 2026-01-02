// Apply the saved theme settings from local storage
document.querySelector("html").setAttribute("data-bs-theme", localStorage.getItem('theme') || 'light');
document.querySelector("html").setAttribute('data-sidebar', localStorage.getItem('sidebarTheme') || 'light');
document.querySelector("html").setAttribute('data-color', localStorage.getItem('color') || 'primary');
document.querySelector("html").setAttribute('data-topbar', localStorage.getItem('topbar') || 'white');
document.querySelector("html").setAttribute('data-layout', localStorage.getItem('layout') || 'default');
document.querySelector("html").setAttribute('data-size', localStorage.getItem('size') || 'default');
document.querySelector("html").setAttribute('data-width', localStorage.getItem('width') || 'fluid');

let themesettings = `
<div class="sidebar-contact">
    <div class="toggle-theme"  data-bs-toggle="offcanvas" data-bs-target="#theme-setting"><i class="ti ti-settings"></i></div>
    </div>
    <div class="sidebar-themesettings offcanvas offcanvas-end" id="theme-setting">
    <div class="offcanvas-header d-flex align-items-center justify-content-between bg-primary">
        <div>
            <h5 class="text-white mb-0">Theme Customizer</h5>
        </div>
        <button type="button" class="btn-close btn-close-white text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="themesettings-inner offcanvas-body">
        <div class="accordion accordion-bordered" id="settingtheme">
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button text-gray-9 fw-semibold fs-16" type="button" data-bs-toggle="collapse" data-bs-target="#layoutsetting" aria-expanded="true" aria-controls="collapsecustomicon1One">
                        Select Layouts
                    </button>
                </h2>
                <div id="layoutsetting" class="accordion-collapse collapse show">
                    <div class="accordion-body">
                        <div class="theme-content">
                            <div class="row g-3">
                                <div class="col-4">
                                    <div class="theme-layout">
                                        <input type="radio" name="LayoutTheme" id="defaultLayout" value="default" checked>
                                        <label for="defaultLayout">
                                            <span class="d-block mb-2 layout-img">
                                                <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                                <img src="assets/img/theme/default.svg" alt="img">
                                            </span>                                     
                                            <span class="layout-type">Default</span>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="theme-layout">
                                        <input type="radio" name="LayoutTheme" id="miniLayout" value="mini">
                                        <label for="miniLayout">
                                            <span class="d-block mb-2 layout-img">
                                            <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                                <img src="assets/img/theme/mini.svg" alt="img">
                                            </span>                                    
                                            <span class="layout-type">Mini</span>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="theme-layout">
                                        <input type="radio" name="LayoutTheme" id="hoverviewLayout" value="hoverview">
                                        <label for="hoverviewLayout">
                                            <span class="d-block mb-2 layout-img">
                                            <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                                <img src="assets/img/theme/mini.svg" alt="img">
                                            </span>                                    
                                            <span class="layout-type">Hover View</span>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="theme-layout">
                                        <input type="radio" name="LayoutTheme" id="hiddenLayout" value="hidden">
                                        <label for="hiddenLayout">
                                            <span class="d-block mb-2 layout-img">
                                            <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                                <img src="assets/img/theme/full-width.svg" alt="img">
                                            </span>                                    
                                            <span class="layout-type">Hidden</span>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="theme-layout">
                                        <input type="radio" name="LayoutTheme" id="full-widthLayout" value="full-width">
                                        <label for="full-widthLayout">
                                            <span class="d-block mb-2 layout-img">
                                            <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                                <img src="assets/img/theme/full-width.svg" alt="img">
                                            </span>                                    
                                            <span class="layout-type">Full Width</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> 
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button text-gray-9 fw-semibold fs-16" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarcolorsetting" aria-expanded="true">
                        Sidebar Color
                    </button>
                </h2>
                <div id="sidebarcolorsetting" class="accordion-collapse collapse show">
                    <div class="accordion-body">
                     <div class="theme-content">
                     <h6 class="fs-14 fw-medium mb-2">Solid Colors</h6>
                       <div class="d-flex align-items-center flex-wrap">
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="lightSidebar" value="light" checked>
                                <label for="lightSidebar" class="d-block rounded mb-2">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="sidebar2Sidebar" value="sidebar2">
                                <label for="sidebar2Sidebar" class="d-block rounded bg-white mb-2">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="sidebar3Sidebar" value="sidebar3">
                                <label for="sidebar3Sidebar" class="d-block rounded bg-dark mb-2">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="sidebar4Sidebar" value="sidebar4">
                                <label for="sidebar4Sidebar" class="d-block rounded bg-primary mb-2">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="sidebar5Sidebar" value="sidebar5">
                                <label for="sidebar5Sidebar" class="d-block rounded bg-secondary mb-2">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="sidebar6Sidebar" value="sidebar6">
                                <label for="sidebar6Sidebar" class="d-block rounded bg-info mb-2">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>    
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="sidebar7Sidebar" value="sidebar7">
                                <label for="sidebar7Sidebar" class="d-block rounded bg-success mb-2">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>      
                        </div>
                        <h6 class="fs-14 fw-medium mb-2">Gradient Colors</h6>
                       <div class="d-flex align-items-center flex-wrap">
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="gradientsidebar1Sidebar" value="gradientsidebar1">
                                <label for="gradientsidebar1Sidebar" class="d-block rounded bg-primary bg-gradient">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="gradientsidebar2Sidebar" value="gradientsidebar2">
                                <label for="gradientsidebar2Sidebar" class="d-block rounded bg-secondary bg-gradient">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="gradientsidebar3Sidebar" value="gradientsidebar3">
                                <label for="gradientsidebar3Sidebar" class="d-block rounded bg-success bg-gradient">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="gradientsidebar4Sidebar" value="gradientsidebar4">
                                <label for="gradientsidebar4Sidebar" class="d-block rounded bg-info bg-gradient">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="gradientsidebar5Sidebar" value="gradientsidebar5">
                                <label for="gradientsidebar5Sidebar" class="d-block rounded bg-dark bg-gradient">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>
                            <div class="theme-colorselect m-1 me-2">
                                <input type="radio" name="sidebar" id="gradientsidebar6Sidebar" value="gradientsidebar6">
                                <label for="gradientsidebar6Sidebar" class="d-block rounded bg-danger bg-gradient">
                                    <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                </label>
                            </div>    
                        </div>
                    </div>
                    </div>
                </div>
            </div>    
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button text-gray-9 fw-semibold fs-16" type="button" data-bs-toggle="collapse" data-bs-target="#colorsetting" aria-expanded="true">
                        Top Bar Color
                    </button>
                </h2>
                <div id="colorsetting" class="accordion-collapse collapse show">
                    <div class="accordion-body pb-1">
                        <div class="theme-content">
                            <h6 class="fs-14 fw-medium mb-2">Solid Colors</h6>
                            <div class="d-flex align-items-center flex-wrap topbar-background">
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="whiteTopbar" value="white" checked>
                                    <label for="whiteTopbar" class="white-topbar">
                                        <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                    </label>
                                </div>
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="topbar1Topbar" value="topbar1">
                                    <label for="topbar1Topbar" class="bg-light"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="topbar2Topbar" value="topbar2">
                                    <label for="topbar2Topbar" class="bg-dark"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="topbar3Topbar" value="topbar3">
                                    <label for="topbar3Topbar" class="bg-primary"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="topbar4Topbar" value="topbar4">
                                    <label for="topbar4Topbar" class="bg-secondary"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>                   
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="topbar5Topbar" value="topbar5">
                                    <label for="topbar5Topbar" class="bg-info"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>                   
                                <div class="theme-colorselect mb-3">
                                    <input type="radio" name="topbar" id="topbar6Topbar" value="topbar6">
                                    <label for="topbar6Topbar" class="bg-success"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div> 
                            </div>
                            <h6 class="fs-14 fw-medium mb-2">Gradient Colors</h6>
                            <div class="d-flex align-items-center flex-wrap topbar-background">
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="gradienttopbar1Topbar" value="gradienttopbar1">
                                    <label for="gradienttopbar1Topbar" class="bg-primary bg-gradient">
                                        <span class="theme-check rounded-circle"><i class="ti ti-check"></i></span>
                                    </label>
                                </div>
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="gradienttopbar2Topbar" value="gradienttopbar2">
                                    <label for="gradienttopbar2Topbar" class="bg-secondary bg-gradient "><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="gradienttopbar3Topbar" value="gradienttopbar3">
                                    <label for="gradienttopbar3Topbar" class="bg-success bg-gradient"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="gradienttopbar4Topbar" value="gradienttopbar4">
                                    <label for="gradienttopbar4Topbar" class="bg-info bg-gradient"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="gradienttopbar5Topbar" value="gradienttopbar5">
                                    <label for="gradienttopbar5Topbar" class="bg-dark bg-gradient"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>                   
                                <div class="theme-colorselect mb-3 me-3">
                                    <input type="radio" name="topbar" id="gradienttopbar6Topbar" value="gradienttopbar6">
                                    <label for="gradienttopbar6Topbar" class="bg-danger bg-gradient"><span class="theme-check rounded-circle"><i class="ti ti-check"></i></span></label>
                                </div>                  
                            </div>
                        </div>
                    </div>
                </div>
            </div>    	
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button text-gray-9 fw-semibold fs-16" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarcolor" aria-expanded="true">
                        Theme Colors
                    </button>
                </h2>
                <div id="sidebarcolor" class="accordion-collapse collapse show">
                    <div class="accordion-body pb-2">
                        <div class="theme-content">
                            <div class="d-flex align-items-center flex-wrap">
                                <div class="theme-colorsset me-2 mb-2">
                                    <input type="radio" name="color" id="primaryColor" value="primary" checked>
                                    <label for="primaryColor" class="primary-clr"></label>
                                </div>
                                <div class="theme-colorsset me-2 mb-2">
                                    <input type="radio" name="color" id="secondaryColor" value="secondary">
                                    <label for="secondaryColor" class="secondary-clr"></label>
                                </div>
                                <div class="theme-colorsset me-2 mb-2">
                                    <input type="radio" name="color" id="successColor" value="success">
                                    <label for="successColor" class="success-clr"></label>
                                </div>
                                <div class="theme-colorsset me-2 mb-2">
                                    <input type="radio" name="color" id="dangerColor" value="danger">
                                    <label for="dangerColor" class="danger-clr"></label>
                                </div>
                                <div class="theme-colorsset me-2 mb-2">
                                    <input type="radio" name="color" id="infoColor" value="info">
                                    <label for="infoColor" class="info-clr"></label>
                                </div>
                                <div class="theme-colorsset me-2 mb-2">
                                    <input type="radio" name="color" id="warningColor" value="warning">
                                    <label for="warningColor" class="warning-clr"></label>
                                </div>  
                            </div>
                        </div>
                    </div>
                </div>
            </div> 
        </div> 
    </div>
        <div class="p-3 border-top">
            <div class="row gx-3">
                <div class="col-6">
                    <a href="#" id="resetbutton" class="btn btn-light close-theme w-100"><i class="ti ti-restore me-1"></i>Reset</a>
                </div>
                <div class="col-6">
                    <a href="#" class="btn btn-primary w-100" data-bs-dismiss="offcanvas"><i class="ti ti-shopping-cart-plus me-1"></i>Buy Product</a>
                </div>
            </div>
        </div>    
    </div> `
    
    document.addEventListener("DOMContentLoaded", function() {

        // 🔁 Unified dark/light mode toggle
    const toggleBtn = document.getElementById("light-dark-mode");
    const icon = toggleBtn?.querySelector("i");

    const getTheme = () => localStorage.getItem("theme") || "light";

    const setTheme = (theme) => {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem("theme", theme);
        if (icon) {
            icon.className = `ti ti-${theme === "dark" ? "sun" : "moon"} fs-16`;
        }
    };

    // Set initial theme from localStorage
    setTheme(getTheme());

    // Toggle theme on click
    toggleBtn?.addEventListener("click", () => {
        const newTheme = getTheme() === "light" ? "dark" : "light";
        setTheme(newTheme);
        handleInputChange(); // <- if your layout needs to reapply settings
    });

    // Make sure the rest of your logic uses `getTheme()` instead of `localStorage.getItem('darkMode')`
    // For example:
    const initialTheme = getTheme(); // instead of 'savedTheme'


        document.body.insertAdjacentHTML('beforeend', themesettings);

    
        // ✅ Debugging: Check if localStorage is being updated
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        const sidebarRadios = document.querySelectorAll('input[name="sidebar"]');
        const colorRadios = document.querySelectorAll('input[name="color"]');
        const layoutRadios = document.querySelectorAll('input[name="LayoutTheme"]');
        const topbarRadios = document.querySelectorAll('input[name="topbar"]');
        const sidebarBgRadios = document.querySelectorAll('input[name="sidebarbg"]');
        const sizeRadios = document.querySelectorAll('input[name="size"]');
        const widthRadios = document.querySelectorAll('input[name="width"]');
        const topbarbgRadios = document.querySelectorAll('input[name="topbarbg"]');
        const resetButton = document.getElementById('resetbutton');
        const sidebarBgContainer = document.getElementById('sidebarbgContainer');
        const sidebarElement = document.querySelector('.sidebar'); // Adjust this selector to match your sidebar element
    
        function setThemeAndSidebarTheme(theme, sidebarTheme, color, layout, topbar, size, width) {
            // Check if the sidebar element exists
            if (!sidebarElement) {
                console.error('Sidebar element not found');
                return;
            }
    
            // Setting data attributes and classes
            document.documentElement.setAttribute('data-bs-theme', theme);
            document.documentElement.setAttribute('data-sidebar', sidebarTheme);
            document.documentElement.setAttribute('data-color', color);
            document.documentElement.setAttribute('data-layout', layout);
            document.documentElement.setAttribute('data-topbar', topbar);
            document.documentElement.setAttribute('data-size', size);
            document.documentElement.setAttribute('data-width', width);
    
            //track mini-layout set or not
            layout_mini = 0;
            if (layout === 'mini') {
                document.body.classList.add("mini-sidebar");
                document.body.classList.remove("menu-horizontal");
                layout_mini = 1;
            }  else if (layout === 'horizontal') {
                document.body.classList.add("menu-horizontal");
                document.body.classList.remove("mini-sidebar");
            } else if (layout === 'horizontal-single') {
                document.body.classList.add("menu-horizontal");
                document.body.classList.remove("mini-sidebar");
            } else if (layout === 'horizontal-overlay') {
                document.body.classList.add("menu-horizontal");
                document.body.classList.remove("mini-sidebar");
            } else {
                document.body.classList.remove("mini-sidebar", "menu-horizontal");
            }

            
            if (size === 'compact') {
                document.body.classList.add("mini-sidebar");
                document.body.classList.remove("expand-menu");
                layout_mini = 1;
            } else if (size === 'hoverview') {
                document.body.classList.add("expand-menu");
                if(layout_mini == 0){ //remove only mini sidebar not set
                    document.body.classList.remove("mini-sidebar");
                }
            }  else  {
                if(layout_mini == 0){ //remove only mini sidebar not set
                    document.body.classList.remove("mini-sidebar");
                }
                document.body.classList.remove("expand-menu");
            }

            if (width === 'box') {
                document.body.classList.add("layout-box-mode");
                document.body.classList.add("mini-sidebar");
                layout_mini = 1;
            }else {
                if(layout_mini == 0){ //remove only mini sidebar not set
                    document.body.classList.remove("mini-sidebar");
                }
                document.body.classList.remove("layout-box-mode");
            }
            if (((width === 'box') && (layout === 'horizontal')) || ((width === 'box') && (layout === 'horizontal-overlay')) ||
            ((width === 'box') && (layout === 'horizontal-single')) || ((width === 'box') && (layout === 'without-header'))) {
                    document.body.classList.remove("mini-sidebar");
            }
            
            // Saving to localStorage
            localStorage.setItem('theme', theme);
            localStorage.setItem('sidebarTheme', sidebarTheme);
            localStorage.setItem('color', color);
            localStorage.setItem('layout', layout);
            localStorage.setItem('topbar', topbar);
            localStorage.setItem('size', size);
            localStorage.setItem('width', width);
    
            // Show/hide sidebar background options based on layout selection
            if (layout === 'box' && sidebarBgContainer) {
                sidebarBgContainer.classList.add('show');
            } else if (sidebarBgContainer) {
                sidebarBgContainer.classList.remove('show');
            }
        }
    
        function handleSidebarBgChange() {
            const sidebarBg = document.querySelector('input[name="sidebarbg"]:checked') ? document.querySelector('input[name="sidebarbg"]:checked').value : null;
    
            if (sidebarBg) {
                document.body.setAttribute('data-sidebarbg', sidebarBg);
                localStorage.setItem('sidebarBg', sidebarBg);
            } else {
                document.body.removeAttribute('data-sidebarbg');
                localStorage.removeItem('sidebarBg');
            }
        }

        function handleTopbarBgChange() {
            const topbarbg = document.querySelector('input[name="topbarbg"]:checked') ? document.querySelector('input[name="topbarbg"]:checked').value : null;
    
            if (topbarbg) {
                document.body.setAttribute('data-topbarbg', topbarbg);
                localStorage.setItem('topbarbg', topbarbg);
            } else {
                document.body.removeAttribute('data-topbarbg');
                localStorage.removeItem('topbarbg');
            }
        }
    
        function handleInputChange() {
           const theme = localStorage.getItem('theme') || 'light';

            const layout = document.querySelector('input[name="LayoutTheme"]:checked').value;
            
            color = localStorage.getItem('primaryRGB');
            sidebarTheme = localStorage.getItem('sidebarRGB');
            topbar = localStorage.getItem('topbarRGB');
            
            if(document.querySelector('input[name="color"]:checked') != null)
            {
                color = document.querySelector('input[name="color"]:checked').value;
            }else{
                color = 'all'
            }

            if(document.querySelector('input[name="sidebar"]:checked') != null)
            {
                sidebarTheme = document.querySelector('input[name="sidebar"]:checked').value;
            }else{
                sidebarTheme = 'all'
            }

            if(document.querySelector('input[name="topbar"]:checked') != null)
            {
                topbar = document.querySelector('input[name="topbar"]:checked').value;
            }else{
                topbar = 'all'
            }
    
            //setThemeAndSidebarTheme(theme, sidebarTheme, color, layout, topbar, size, width);
            setThemeAndSidebarTheme(theme, sidebarTheme, color, layout, topbar);
        }

      
    
        function resetThemeAndSidebarThemeAndColorAndBg() {
            setThemeAndSidebarTheme('light', 'light', 'primary', 'default', 'white', 'default', 'fluid');
            document.body.removeAttribute('data-sidebarbg');
            document.getElementById('lightSidebar').checked = true;
            document.getElementById('primaryColor').checked = true;
            document.getElementById('defaultLayout').checked = true;
            document.getElementById('whiteTopbar').checked = true;
          //  document.getElementById('defaultSize').checked = true;
            document.getElementById('fluidWidth').checked = true;
    
            const checkedSidebarBg = document.querySelector('input[name="sidebarbg"]:checked');
            if (checkedSidebarBg) {
                checkedSidebarBg.checked = false;
            }
    
            localStorage.removeItem('sidebarBg');

            const checkedTopbarBg = document.querySelector('input[name="topbarbg"]:checked');
            if (checkedTopbarBg) {
                checkedTopbarBg.checked = false;
            }
    
            localStorage.removeItem('topbarbg');

            document.documentElement.setAttribute("data-bs-theme", "light");

            disableDarkMode(); 

        }
    
        // Adding event listeners
        themeRadios.forEach(radio => radio.addEventListener('change', handleInputChange));
        sidebarRadios.forEach(radio => radio.addEventListener('change', handleInputChange));
        colorRadios.forEach(radio => radio.addEventListener('change', handleInputChange));
        layoutRadios.forEach(radio => radio.addEventListener('change', handleInputChange));
        topbarRadios.forEach(radio => radio.addEventListener('change', handleInputChange));
        sizeRadios.forEach(radio => radio.addEventListener('change', handleInputChange));
        widthRadios.forEach(radio => radio.addEventListener('change', handleInputChange));
        sidebarBgRadios.forEach(radio => radio.addEventListener('change', handleSidebarBgChange));
        topbarbgRadios.forEach(radio => radio.addEventListener('change', handleTopbarBgChange));
        resetButton.addEventListener('click', resetThemeAndSidebarThemeAndColorAndBg);
    
        // Initial setup from localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';

      // const savedTheme = localStorage.getItem('theme') || 'light';
        savedSidebarTheme = localStorage.getItem('sidebarTheme');
        savedColor = localStorage.getItem('color');
        const savedLayout = localStorage.getItem('layout') || 'default';
        savedTopbar = localStorage.getItem('topbar');
        const savedSize = localStorage.getItem('size') || 'default';
        const savedWidth = localStorage.getItem('width') || 'fluid';
        const savedSidebarBg = localStorage.getItem('sidebarBg') || null;
        const savedTopbarBg = localStorage.getItem('topbarbg') || null;

        // setup theme color all
        const savedColorPickr = localStorage.getItem('primaryRGB') 
        if((savedColor == null) && (savedColorPickr == null))
        {
            savedColor = 'primary';
        }else if((savedColorPickr != null) && (savedColor == null))
        {
            savedColor = 'all';
            let html = document.querySelector("html");
            html.style.setProperty("--primary-rgb",  savedColorPickr);
        }

        // setup theme topbar all
        const savedTopbarPickr = localStorage.getItem('topbarRGB') 
        if((savedTopbar == null) && (savedTopbarPickr == null))
        {
            savedTopbar = 'white';
        }else if((savedTopbarPickr != null) && (savedTopbar == null))
        {
            savedTopbar = 'all';
            let html = document.querySelector("html");
            html.style.setProperty("--topbar-rgb",  savedTopbarPickr);
        }
 
        // setup theme color all
        const savedSidebarPickr = localStorage.getItem('sidebarRGB') 
        if((savedSidebarTheme == null) && (savedSidebarPickr == null))
        {
            savedSidebarTheme = 'light';
        } else if((savedSidebarPickr != null) && (savedSidebarTheme == null))
        {
           savedSidebarTheme = 'all';
            let html = document.querySelector("html");
            html.style.setProperty("--sidebar-rgb",  savedSidebarPickr);
        }
    
        setThemeAndSidebarTheme(savedTheme, savedSidebarTheme, savedColor, savedLayout, savedTopbar, savedSize, savedWidth);
    
        if (savedSidebarBg) {
            document.body.setAttribute('data-sidebarbg', savedSidebarBg);
        } else {
            document.body.removeAttribute('data-sidebarbg');
        }

        if (savedTopbarBg) {
            document.body.setAttribute('data-topbarbg', savedTopbarBg);
        } else {
            document.body.removeAttribute('data-topbarbg');
        }
    
        // Check and set radio buttons based on saved preferences
        if (document.getElementById(`${savedTheme}Theme`)) {
            document.getElementById(`${savedTheme}Theme`).checked = true;
        }
        if (document.getElementById(`${savedSidebarTheme}Sidebar`)) {
            document.getElementById(`${savedSidebarTheme}Sidebar`).checked = true;
        }
        if (document.getElementById(`${savedColor}Color`)) {
            document.getElementById(`${savedColor}Color`).checked = true;
        }
        if (document.getElementById(`${savedLayout}Layout`)) {
            document.getElementById(`${savedLayout}Layout`).checked = true;
        }
        if (document.getElementById(`${savedTopbar}Topbar`)) {
            document.getElementById(`${savedTopbar}Topbar`).checked = true;
        }
        if (document.getElementById(`${savedSize}Size`)) {
            document.getElementById(`${savedSize}Size`).checked = true;
        }
        if (document.getElementById(`${savedWidth}Width`)) {
            document.getElementById(`${savedWidth}Width`).checked = true;
        }
        if (savedSidebarBg && document.getElementById(`${savedSidebarBg}`)) {
            document.getElementById(`${savedSidebarBg}`).checked = true;
        }
        if (savedTopbarBg && document.getElementById(`${savedTopbarBg}`)) {
            document.getElementById(`${savedTopbarBg}`).checked = true;
        }
    
        // Initially hide sidebar background options based on layout
        if (savedLayout !== 'box' && sidebarBgContainer) {
            sidebarBgContainer.classList.remove('show');
        }
    });
    
   
    
    




    








    

