
<!DOCTYPE html>
<html lang="en">
<head>

	<!-- Meta Tags -->   
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Reset Password || eLaw Lawyer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="author" content="Cyber Impulses Software Solutions">
	
    <!-- Favicon -->
    <link rel="shortcut icon" href="../superadminassets/img/favicon.png">

    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="../superadminassets/img/apple-icon.png">

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script>

	<!-- Tabler Icons CSS -->
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
    <div class="main-wrapper auth-bg position-relative overflow-hidden">

        <!-- Start Content -->
		<div class="container-fuild position-relative z-1">
			<div class="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">

				<!-- start row -->
				<div class="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
					<div class="col-lg-4 mx-auto">
						<form action="login.php" class="d-flex justify-content-center align-items-center" method="POST">
							<div class="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
								<div class=" mx-auto mb-4 text-center">
									
								</div>
								<div class="card border-1 p-lg-3 shadow-md rounded-3 mb-4">
									<div class="card-body">
										<div class="text-center mb-3">
                                            <img src="../superadminassets/img/logo.png" class="img-fluid" alt="Logo" style="width:30%;">
											<h5 class="mb-1 fs-20 fw-bold">Reset Password</h5>
											<p class="mb-0">Your new password must be different from previous used passwords.</p>
										</div>
										<div class="mb-3">
											<label for="password" class="form-label">Password</label>
											<div class="position-relative">
                                                <div class="pass-group input-group position-relative border rounded">
                                                    <span class="input-group-text bg-white border-0">
                                                        <i class="ti ti-lock text-dark fs-14"></i>
                                                    </span>
                                                    <input type="password" id="password" name="password" data-kilvish-password="8_20" class="ps-0 border-0 form-control kilpass" placeholder="****************" required>
													<span toggle="#newPassword" class="fa fa-eye-slash toggle-password"></span>
                                                </div>
                                            </div>
										</div>
                                        <div class="mb-3">
											<label for="confirmpassword" class="form-label">Confirm Password</label>
											<div class="position-relative">
                                                <div class="pass-group input-group position-relative border rounded">
                                                    <span class="input-group-text bg-white border-0">
                                                        <i class="ti ti-lock text-dark fs-14"></i>
                                                    </span>
                                                    <input type="password" id="confirmpassword" name="confirmpassword" data-kilvish-password="8_20" class="ps-0 border-0 form-control kilpass" placeholder="****************" required>
													<span toggle="#newPassword" class="fa fa-eye-slash toggle-password"></span>
                                                </div>
                                            </div>
										</div>
										<div class="mb-3">
											<button type="submit" name="submit" id="submit" class="btn bg-primary text-white w-100">Submit </button>
										</div>
										<div class="text-center">
											<h6 class="fw-normal fs-14 text-dark mb-0">Return to
												<a href="login.php" class="hover-a"> Login</a>
											</h6>
										</div>
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

        <!-- Start Bg Content -->

        <img src="../superadminassets/img/auth/auth-bg-top.png" alt="" class="img-fluid element-01">
        <img src="../superadminassets/img/auth/auth-bg-bot.png" alt="" class="img-fluid element-02">
        <!-- End Bg Content -->

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