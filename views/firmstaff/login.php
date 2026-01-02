
<!DOCTYPE html>
<html lang="en">
<head>
	<!-- Meta Tags -->
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Login || eLaw Staff</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="author" content="Cyber Impulses Software Solutions">
	
    <!-- Favicon -->
    <link rel="shortcut icon" href="../superadminassets/img/favicon.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="../superadminassets/img/apple-icon.png">

	<!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script>

	<!-- Tabler Icons v3.34.1 CSS -->
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">

    <!-- Simplebar CSS -->
   	<link href="https://cdn.jsdelivr.net/npm/simplebar@6.3.2/dist/simplebar.min.css" rel="stylesheet">
	<script src="https://cdn.jsdelivr.net/npm/simplebar@6.3.2/dist/simplebar.min.js"></script>

    <!-- Fontawesome CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.0.0/css/fontawesome.min.css">
	<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.0.0/css/all.min.css" rel="stylesheet">

    <!-- Main CSS -->
    <link rel="stylesheet" href="../superadminassets/css/style.css">
</head>
<body>

    <!-- Begin Wrapper -->
    <div class="main-wrapper auth-bg auth-bg-custom position-relative overflow-hidden">

        <!-- Start Content -->
		<div class="container-fuild position-relative z-1">
			<div class="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">

				<!-- start row -->
				<div class="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap py-3">
					<div class="col-lg-4 mx-auto">
						<form action="index.php" class="d-flex justify-content-center align-items-center" method="POST">
							<div class="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
								<div class=" mx-auto mb-4 text-center">
									
								</div>
								<div class="card border-1 p-lg-3 shadow-md rounded-3 mb-4">
									<div class="card-body">
										<div class="text-center mb-3">
											<img src="../superadminassets/img/logo.png" class="img-fluid" alt="Logo" style="width:30%;">
											<p class="mb-0">Please enter below details to access the dashboard</p>
										</div>
										<div class="mb-3">
											<label for="email" class="form-label">Email</label>
											<div class="input-group">
												<span class="input-group-text border-end-0 bg-white">
													<i class="ti ti-mail fs-14 text-dark"></i>
												</span>
												<input type="email" id="email" name="email" class="form-control border-start-0 ps-0" placeholder="Enter Email Address" required>
											</div>
										</div>
										<div class="mb-3">
											<label for="password" class="form-label">Password</label>
											<div class="position-relative">
												<div class="pass-group input-group position-relative border rounded">
                                                    <span class="input-group-text bg-white border-0">
                                                        <i class="ti ti-lock text-dark fs-14"></i>
                                                    </span>
													<input type="password" id="password" name="password" data-kilvish-password="8_20" class="ps-0 border-0 form-control kilpass" placeholder="Enter password" placeholder="****************" required>
													<span toggle="#newPassword" class="fa fa-eye-slash toggle-password"></span>
                                                </div>
                                            </div>
										</div>
										<div class="d-flex align-items-center justify-content-between mb-3">
											<div class="d-flex align-items-center">
												<!-- <div class="form-check form-check-md mb-0">
													<input class="form-check-input" id="remember_me" type="checkbox">
													<label for="remember_me" class="form-check-label mt-0 text-dark">Remember Me</label>
												</div> -->
											</div>
											<div class="text-end">
												<a href="forgot-password.php" class="text-danger">Forgot Password?</a>
											</div>
										</div>
										<div class="mb-2">
											<button type="submit" name="login" id="login" class="btn bg-primary text-white w-100">Login</button>
										</div>
										<!-- <div class="login-or position-relative mb-3">
											<span class="span-or">OR</span>
										</div>
										<div class="mb-3">
											<div class="d-flex align-items-center justify-content-center flex-wrap">
												<div class="text-center me-2 flex-fill">
													<a href="javascript:void(0);"
														class="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center">
														<img class="img-fluid m-1" src="../superadminassets/img/icons/google-logo.svg" alt="Google">
													</a>
												</div>
												<div class="text-center me-2 flex-fill">
													<a href="javascript:void(0);"
														class="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center">
														<img class="img-fluid m-1" src="../superadminassets/img/icons/facebook-logo.svg" alt="Facebook">
													</a>
												</div>
                                                <div class="text-center me-2 flex-fill">
													<a href="javascript:void(0);"
														class="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center">
														<img class="img-fluid m-1" src="../superadminassets/img/icons/apple-logo.svg" alt="apple">
													</a>
												</div>
											</div>
										</div> -->
										<!-- <div class="text-center">
											<h6 class="fw-normal fs-14 text-dark mb-0">Don’t have an account yet?
												<a href="registration.php" class="hover-a"> Register</a>
											</h6>
										</div> -->
									</div><!-- end card body -->
								</div><!-- end card -->
							</div>
						</form> 
						<p class="text-dark text-center"> Copyright &copy; 2025 - <a href="#" class="text-info">eLaw</a>. All Rights Reserved | Design by <a href="https://myambergroup.com/" target="_blank" class="text-info">Amber Group</a></p>
					</div><!-- end col -->
				</div>
				<!-- end row -->
			</div>
		</div>
		<!-- End Content -->
    </div>
    <!-- End Wrapper -->  

<!-- jQuery -->
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

<!-- Bootstrap Core JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script> 

<!-- Main JS -->
<script src="../superadminassets/js/script.js"></script>

</body>
</html>

<script>
//================ KILEYE PASSWORD SCRIPT =================//
document.addEventListener("DOMContentLoaded", function () {
	const toggleButtons = document.querySelectorAll(".toggle-password");

	toggleButtons.forEach(function (toggleButton, index) {
		const passwordInput = document.querySelectorAll(".kilpass")[index];

		function showPassword() {
			passwordInput.setAttribute("type", "text");
			
			toggleButton.classList.remove("fa-eye-slash");
			toggleButton.classList.add("fa-eye");
		}

		function hidePassword() {
			passwordInput.setAttribute("type", "password");
		
			toggleButton.classList.remove("fa-eye");
			toggleButton.classList.add("fa-eye-slash");
		}

		toggleButton.addEventListener("mousedown", function (e) {
			e.preventDefault();
			showPassword();
		});
		document.addEventListener("mouseup", hidePassword);

		toggleButton.addEventListener("touchstart", function (e) {
			e.preventDefault();
			showPassword();
		});
		document.addEventListener("touchend", hidePassword);
	});

	// Your cookie clearing logic
	document.cookie = 'sscl_msg=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
	document.cookie = 'sscl_msg=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
});
//================ KILEYE PASSWORD SCRIPT =================//
</script>